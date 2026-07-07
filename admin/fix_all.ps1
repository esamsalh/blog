$path = "C:\Users\pc\Documents\GitHub\blog\admin\dashboard.html"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# ---- Helper ----
function FindNth($text, $pattern, $nth, $start=0) {
    $idx = $start - 1
    for ($i = 0; $i -lt $nth; $i++) {
        $idx = $text.IndexOf($pattern, $idx + 1)
        if ($idx -lt 0) { return -1 }
    }
    return $idx
}

# ======== 1. FIX generateField SWITCH BLOCK ========
$gfStart = $text.IndexOf("async function generateField")
$switchStartIdx = $text.IndexOf("switch (fieldType) {", $gfStart)
$tryIdx = $text.IndexOf("try {", $switchStartIdx)
if ($switchStartIdx -ge 0 -and $tryIdx -gt $switchStartIdx) {
    $oldSwitch = $text.Substring($switchStartIdx, $tryIdx - $switchStartIdx)
    $newSwitch = "switch (fieldType) {
        case `"title`": prompt = `"اقترح عنواناً جذاباً لمقال عن '" + (document.getElementById(`"aiPromptTitle`").value || `"التقنية`") + "' (عنوان واحد فقط)`"; break;
        case `"slug`": prompt = `"اقترح رابط مختصر (slug) للمقال: `" + (title || `"موضوع تقني`"); break;
        case `"excerpt`": prompt = `"اكتب ملخصاً قصيراً للمقال (160 حرف) بعنوان: `" + (title || `"موضوع تقني`"); break;
        case `"content`": prompt = `"اكتب محتوى كامل HTML للمقال بعنوان: `" + (title || `"موضوع تقني`") + `"\nباستخدام h2, h3, p, ul, li. بدون علامات html أو CSS.`"; break;
        case `"custom`": prompt = document.getElementById(`"customPrompt`").value || `"اكتب محتوى عن التقنية`"; break;
        case `"faq`": prompt = `"أنشئ 3 أسئلة شائعة (FAQ) بصيغة JSON عن: `" + (title || `"التقنية`") + `"\nالتنسيق: [{q:سؤال,a:جواب}]`"; break;
        case `"meta_title`": prompt = `"اقترح عنوان SEO (Meta Title) للمقال بعنوان: `" + (title || `"موضوع`"); break;
        case `"meta_desc`": prompt = `"اكتب وصف SEO (Meta Description) للمقال بعنوان: `" + (title || `"موضوع`"); break;
      }
"
    $text = $text.Remove($switchStartIdx, $tryIdx - $switchStartIdx).Insert($switchStartIdx, $newSwitch)
    Write-Host "1: generateField switch block DONE" -ForegroundColor Green
} else { Write-Host "1 FAILED" -ForegroundColor Red }

# ======== 2. FIX pushDataToGitHub - article folder ========
$pdgIdx = $text.IndexOf("function pushDataToGitHub")
$oldFold = 'const folder = "articles/" + a.slug;'
$foldIdx = $text.IndexOf($oldFold, $pdgIdx)
if ($foldIdx -ge 0) {
    $newCat = '          const cat = categories.find(x => x.id === a.category) || { slug: "general" };'
    $newFold = '          const folder = "blog/" + cat.slug + "/" + a.slug;'
    $text = $text.Replace($oldFold, $newFold)
    $text = $text.Insert($foldIdx, $newCat + "`n")
    Write-Host "2a: article folder DONE" -ForegroundColor Green
} else { Write-Host "2a: NOT FOUND" -ForegroundColor Yellow }

$oldImg = '"articles/" + a.slug + "/img/default.png"'
$imgIdx = $text.IndexOf($oldImg, $pdgIdx)
if ($imgIdx -ge 0) {
    $newImg = '"blog/" + cat.slug + "/" + a.slug + "/img/default.png"'
    $text = $text.Replace($oldImg, $newImg)
    Write-Host "2b: image path DONE" -ForegroundColor Green
} else { Write-Host "2b: NOT FOUND" -ForegroundColor Yellow }

# ======== 3. FIX pushDataToGitHub - category folder ========
$oldCat = '"category/" + c.slug + "/index.html"'
$catIdx = $text.IndexOf($oldCat, $pdgIdx)
if ($catIdx -ge 0) {
    $text = $text.Replace($oldCat, '"blog/" + c.slug + "/index.html"')
    Write-Host "3: category path DONE" -ForegroundColor Green
} else { Write-Host "3: NOT FOUND (may already be blog/)" -ForegroundColor Yellow }

# ======== 4. FIX category links in template generators ========
$funcs = @("generateBlogHomepage", "generateArticlePage", "generateCategoryPage")
$catFixCount = 0
foreach ($func in $funcs) {
    $startAt = $text.IndexOf("function $func")
    if ($startAt -lt 0) { continue }
    # Find where this function ends by looking for next function
    $endAt = $text.Length
    foreach ($other in $funcs) {
        if ($other -eq $func) { continue }
        $nf = $text.IndexOf("function $other", $startAt + 10)
        if ($nf -gt 0 -and $nf -lt $endAt) { $endAt = $nf }
    }
    # Fix ../category/ links
    $si = $startAt
    while ($si -lt $endAt) {
        $ci = $text.IndexOf("../category/", $si)
        if ($ci -lt 0 -or $ci -ge $endAt) { break }
        $text = $text.Remove($ci, "../category/".Length).Insert($ci, "../blog/")
        $catFixCount++
        $si = $ci + 10
    }
    # Fix href="category/ links
    $si = $startAt
    while ($si -lt $endAt) {
        $ci = $text.IndexOf('href="category/', $si)
        if ($ci -lt 0 -or $ci -ge $endAt) { break }
        $text = $text.Remove($ci, 'href="category/'.Length).Insert($ci, 'href="blog/')
        $catFixCount++
        $si = $ci + 10
    }
}
if ($catFixCount -gt 0) { Write-Host "4: category links in templates DONE ($catFixCount)" -ForegroundColor Green }
else { Write-Host "4: no category links to fix" -ForegroundColor Yellow }

# ======== 5. FIX ../articles/ links in templates ========
$artFixCount = 0
foreach ($func in @("generateArticlePage", "generateCategoryPage")) {
    $startAt = $text.IndexOf("function $func")
    if ($startAt -lt 0) { continue }
    $endAt = $text.Length
    foreach ($other in @("generateBlogHomepage","generateArticlePage","generateCategoryPage","saveArticle","editArticle","populateDashboard","populateArticlesList","pushDataToGitHub","generateField","generateContentWithAI")) {
        if ($other -eq $func) { continue }
        $nf = $text.IndexOf("function $other", $startAt + 10)
        if ($nf -gt 0 -and $nf -lt $endAt) { $endAt = $nf }
    }
    $si = $startAt
    while ($si -lt $endAt) {
        $ci = $text.IndexOf("../articles/", $si)
        if ($ci -lt 0 -or $ci -ge $endAt) { break }
        $text = $text.Remove($ci, "../articles/".Length).Insert($ci, "../blog/")
        $artFixCount++
        $si = $ci + 14
    }
}
if ($artFixCount -gt 0) { Write-Host "5: article links fixed DONE ($artFixCount)" -ForegroundColor Green }
else { Write-Host "5: no ../articles/ links" -ForegroundColor Yellow }

# ======== 6. FIX image paths referencing articles/ in dashboard functions ========
# Pattern: 'articles/' + a.slug + '/img/default.png'
# Already handled in pushDataToGitHub above
# Check populateDashboard, populateArticlesList, editArticle
$imgFixCount = 0
foreach ($func in @("populateDashboard", "populateArticlesList", "editArticle")) {
    $funcIdx = $text.IndexOf("function $func")
    if ($funcIdx -lt 0) { continue }
    $si = $funcIdx
    while ($si -gt 0) {
        $ai = $text.IndexOf("articles/", $si)
        if ($ai -lt 0) { break }
        $ctx = $text.Substring([Math]::Max(0,$ai-40), [Math]::Min(80,$ai+80))
        # Check if this is in an image path pattern
        if ($ctx.Contains("img") -and ($ctx.Contains("slug") -or $ctx.Contains("default.png"))) {
            Write-Host "  Image path at ${ai}: ${ctx}" -ForegroundColor White
        }
        $si = $ai + 10
    }
}

# ======== 7. FIX generateBlogHomepage article cards (articles/ -> blog/cat.slug/) ========
$gbhIdx = $text.IndexOf("function generateBlogHomepage")
if ($gbhIdx -ge 0) {
    $gbhEnd = $text.IndexOf("function generateArticlePage", $gbhIdx)
    if ($gbhEnd -lt 0) { $gbhEnd = $text.Length }
    # In the articleCards map, c is already defined: const c = categories.find(x => x.id === a.category) || ...
    # So we can reference c.slug
    # Pattern: href="articles/' + a.slug + '"
    # Need: href="blog/' + c.slug + '/' + a.slug + '"
    # In the source: href="articles/' + a.slug + '"
    $si = $gbhIdx
    $count = 0
    while ($si -lt $gbhEnd) {
        $ai = $text.IndexOf("articles/", $si)
        if ($ai -lt 0 -or $ai -ge $gbhEnd) { break }
        # Check if c.slug is in scope
        $preContext = $text.Substring([Math]::Max(0,$ai-300), [Math]::Min(300,$ai))
        if ($preContext.Contains("c = categories.find") -or $preContext.Contains("cat.slug")) {
            # Read the template string around this link
            # Pattern: "articles/'"'"' + a.slug + '"'"'"
            # Raw chars: "articles/' + a.slug + '"
            # We need: "blog/' + c.slug + '/' + a.slug + '"
            
            # Find the single quote after 'articles/'
            $sqIdx = $text.IndexOf("'", $ai + 10)
            if ($sqIdx -gt 0 -and $sqIdx -lt $ai + 20) {
                # Found the single quote: articles/'
                # The pattern is: articles/' + a.slug + '
                # We need: blog/' + c.slug + '/' + a.slug + '
                # So we replace "articles/" with "blog/" + c.slug + "/"
                # Actually, the exact replacement:
                # "articles/'"  ->  "blog/'" + c.slug + "'/'" 
                # No, that's wrong. Let me just see the exact chars.
                $exact = $text.Substring($ai, 25)
                Write-Host "  article link at ${ai}: ${exact}" -ForegroundColor White
                
                # Replace "articles/'" with "blog/'" + c.slug + "'/'" 
                # Wait, in JS template literal: `href="articles/' + a.slug + '"`
                # The `'` is a literal single quote char inside HTML
                # So: articles/' + a.slug + '
                # Replace with: blog/' + c.slug + '/' + a.slug + '
                
                # Find the end of the pattern: find the closing ' after a.slug
                $closingQuote = $text.IndexOf("'", $sqIdx + 1)
                if ($closingQuote -gt $sqIdx) {
                    $afterSlug = $text.IndexOf("'", $closingQuote + 1)
                    if ($afterSlug -gt $closingQuote) {
                        # Found patterns: articles/' + a.slug + '
                        # Replace articles/' with blog/' + c.slug + '/'
                        $text = $text.Remove($ai, 10)  # Remove "articles/"
                        $text = $text.Insert($ai, "blog/" + "'" + " + c.slug + " + "'" + "/")
                        $count++
                    }
                }
            }
        }
        $si = $ai + 14
    }
    if ($count -gt 0) { Write-Host "7: blog homepage article links DONE ($count)" -ForegroundColor Green }
    else { Write-Host "7: no article links in blog homepage" -ForegroundColor Yellow }
}

# ======== WRITE ========
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($text))
Write-Host "`nFile written!" -ForegroundColor Green
