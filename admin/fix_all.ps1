$path = "C:\Users\pc\Documents\GitHub\blog\admin\dashboard.html"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# 1. Fix generateField - replace the whole switch block (between "switch (fieldType)" and the closing brace of the function)
# Find the switch block start
$sw = $text.IndexOf('switch (fieldType) {')
$fnEnd = $text.IndexOf('}', $sw)
# Actually let's find the function boundaries better
$fnStart = $text.LastIndexOf('async function generateField', $sw)
# Read from sw to the try statement
$tryIdx = $text.IndexOf('try {', $sw)
# Replace the part between switch { and try {
$swBodyStart = $text.IndexOf('{', $sw) + 1
$swBodyEnd = $text.LastIndexOf('}', $tryIdx - 1)
# Find where the switch ends (the last } before the catch)
$closeBrace = $swBodyEnd
while ($closeBrace -lt $text.Length -and $text.Substring($closeBrace, 1) -ne '}') { $closeBrace++ }
# Actually simpler: just replace from switch start + 1 to try {
$swStartContent = $text.IndexOf('{', $sw) + 1
$swEndContent = $text.LastIndexOf('try {', $fnEnd) - 1
# Trim whitespace
$swEndContent = $text.LastIndexOf("`n", $swEndContent)

$newSwitchBody = @'
      let prompt = "";
      switch (fieldType) {
        case "title": prompt = "اقترح عنواناً جذاباً لمقال عن '" + (document.getElementById("aiPromptTitle").value || "التقنية") + "' (عنوان واحد فقط)"; break;
        case "slug": prompt = "اقترح رابط مختصر (slug) للمقال: " + (title || "موضوع تقني"); break;
        case "excerpt": prompt = "اكتب ملخصاً قصيراً للمقال (160 حرف) بعنوان: " + (title || "موضوع تقني"); break;
        case "content": prompt = "اكتب محتوى كامل HTML للمقال بعنوان: " + (title || "موضوع تقني") + "\nباستخدام h2, h3, p, ul, li. بدون علامات html أو CSS."; break;
        case "custom": prompt = document.getElementById("customPrompt").value || "اكتب محتوى عن التقنية"; break;
        case "faq": prompt = "أنشئ 3 أسئلة شائعة (FAQ) بصيغة JSON عن: " + (title || "التقنية") + "\nالتنسيق: [{q:سؤال,a:جواب}]"; break;
        case "meta_title": prompt = "اقترح عنوان SEO (Meta Title) للمقال بعنوان: " + (title || "موضوع"); break;
        case "meta_desc": prompt = "اكتب وصف SEO (Meta Description) للمقال بعنوان: " + (title || "موضوع"); break;
      }
'@

# Find the exact boundaries more carefully
$fromSwitch = $text.IndexOf('switch (fieldType) {', $fnStart)
$fromTry = $text.IndexOf('try {', $fromSwitch)
$blockToReplace = $text.Substring($fromSwitch, $fromTry - $fromSwitch)
$newBlock = "switch (fieldType) {`n" + $newSwitchBody.Trim() + "`n      "
$text = $text.Remove($fromSwitch, $fromTry - $fromSwitch).Insert($fromSwitch, $newBlock)
"Fix 1: generateField prompts - done"

# 2. Fix pushDataToGitHub - change articles path
$artIdx = $text.IndexOf('const folder = "articles/" + a.slug;')
if ($artIdx -ge 0) {
    $text = $text.Remove($artIdx, 'const folder = "articles/" + a.slug;'.Length)
    $text = $text.Insert($artIdx, 'const cat = categories.find(x => x.id === a.category) || { slug: "general" };`n          const folder = "blog/" + cat.slug + "/" + a.slug;')
    "Fix 2a: article folder path - done"
} else { "Fix 2a: articles pattern not found" }

# Also fix the image path in the same function
$imgIdx = $text.IndexOf('"articles/" + a.slug + "/img/default.png"')
if ($imgIdx -ge 0) {
    $text = $text.Remove($imgIdx, '"articles/" + a.slug + "/img/default.png"'.Length)
    $text = $text.Insert($imgIdx, '"blog/" + cat.slug + "/" + a.slug + "/img/default.png"')
    "Fix 2b: image path - done"
} else { "Fix 2b: image path not found" }

# 3. Fix category path - change "category/" + c.slug + "/index.html"
$catIdx = $text.IndexOf('"category/" + c.slug + "/index.html"')
if ($catIdx -ge 0) {
    $text = $text.Remove($catIdx, '"category/" + c.slug + "/index.html"'.Length)
    $text = $text.Insert($catIdx, '"blog/" + c.slug + "/index.html"')
    "Fix 3: category path - done"
} else { "Fix 3: category path not found" }

# 4. Fix generateBlogHomepage - category link in catCards
$catLinkIdx = $text.IndexOf('href="category/')
while ($catLinkIdx -ge 0) {
    $text = $text.Remove($catLinkIdx, 'href="category/'.Length)
    $text = $text.Insert($catLinkIdx, 'href="blog/')
    $catLinkIdx = $text.IndexOf('href="category/', $catLinkIdx + 10)
}
"Fix 4: generateBlogHomepage category links - done"

# 5. Fix generateBlogHomepage - article link in articleCards
# Pattern: href="articles/'"'"' + a.slug + '"'"'"
# In the actual UTF8 text, this is: href="articles/' + a.slug + '"
$artLinkIdx = $text.IndexOf('href="articles/')
while ($artLinkIdx -ge 0) {
    # Check if this is in a template generator context (inside generateBlogHomepage, generateArticlePage, or generateCategoryPage)
    $contextStart = [Math]::Max(0, $artLinkIdx - 200)
    $context = $text.Substring($contextStart, $artLinkIdx - $contextStart)
    if ($context.Contains('generateBlogHomepage') -or $context.Contains('generateArticlePage') -or $context.Contains('generateCategoryPage')) {
        # We need to add the category slug. This is tricky because we need cat in scope.
        # For generateBlogHomepage: replace 'articles/' + a.slug with 'blog/' + c.slug + '/' + a.slug
        # But the pattern varies by function. Let me handle each separately.
    }
    $artLinkIdx = $text.IndexOf('href="articles/', $artLinkIdx + 10)
}

# Handle generateBlogHomepage article link specifically - replace the whole articleCards template
# The pattern is: href="articles/' + a.slug + '"
# We need to insert c.slug: href="blog/' + c.slug + '/' + a.slug + '"
$homeArticleLink = $text.IndexOf('href="articles/' + "'" + '"' + "'" + ' + a.slug + ' + "'" + '"' + "'" + '"')
# That's not right due to encoding. Let me search for the raw pattern.
$rawPattern = 'href="articles/'
$genBlogIdx = $text.IndexOf('generateBlogHomepage')
$genBlogEnd = $text.IndexOf('function generateArticlePage', $genBlogIdx)
$articleLinks = New-Object System.Collections.ArrayList
$searchIdx = $genBlogIdx
while ($searchIdx -lt $genBlogEnd) {
    $found = $text.IndexOf($rawPattern, $searchIdx)
    if ($found -lt 0 -or $found -gt $genBlogEnd) { break }
    [void]$articleLinks.Add($found)
    $searchIdx = $found + 10
}
# For each article link in generateBlogHomepage, replace 'articles/' + a.slug with 'blog/' + c.slug + '/' + a.slug
# Since these links are built with string concat, we need to find the specific pattern
foreach ($linkIdx in $articleLinks) {
    # Read around to see the pattern
    $around = $text.Substring($linkIdx, 40)
    "Link at $linkIdx: $around"
}

"Fix 5: article links - partial"

# Write the file
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($text))
"File written"
