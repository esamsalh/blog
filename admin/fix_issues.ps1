$path = "C:\Users\pc\Documents\GitHub\blog\admin\dashboard.html"
$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Fix 1: generateField Arabic prompts
$old1 = 'case "title": prompt = "�碩� ����� ������ ���� �� '"'"' + (document.getElementById("aiPromptTitle").value || "�����") + '"'"' (���� ퟥ� ���)"; break;
        case "slug": prompt = "�碩� ���� ꦢ�� (slug) �����: " + (title || "����� ����"); break;
        case "excerpt": prompt = "�袠 �馭�� �著� ����� (160 ���) �����: " + (title || "����� ����"); break;
        case "content": prompt = "�袠 ꥢ�� ��� HTML ����� �����: " + (title || "����� ����") + "\n�������� h2, h3, p, ul, li. ���� ��꟢ html �� CSS."; break;
        case "custom": prompt = document.getElementById("customPrompt").value || "�袠 ꥢ�� �� �����"; break;
        case "faq": prompt = "�묞 3 ���� ���� (FAQ) ���� JSON ��: " + (title || "�����") + "\n�����: [{q:����,a:�ퟠ}]"; break;
        case "meta_title": prompt = "�碩� ���� SEO (Meta Title) ����� �����: " + (title || "�����"); break;
        case "meta_desc": prompt = "�袠 ��� SEO (Meta Description) ����� �����: " + (title || "�����"); break;'

$new1 = 'case "title": prompt = "اقترح عنواناً جذاباً لمقال عن '"'"' + (document.getElementById("aiPromptTitle").value || "التقنية") + '"'"' (عنوان واحد فقط)"; break;
        case "slug": prompt = "اقترح رابط مختصر (slug) للمقال: " + (title || "موضوع تقني"); break;
        case "excerpt": prompt = "اكتب ملخصاً قصيراً للمقال (160 حرف) بعنوان: " + (title || "موضوع تقني"); break;
        case "content": prompt = "اكتب محتوى كامل HTML للمقال بعنوان: " + (title || "موضوع تقني") + "\nباستخدام h2, h3, p, ul, li. بدون علامات html أو CSS."; break;
        case "custom": prompt = document.getElementById("customPrompt").value || "اكتب محتوى عن التقنية"; break;
        case "faq": prompt = "أنشئ 3 أسئلة شائعة (FAQ) بصيغة JSON عن: " + (title || "التقنية") + "\nالتنسيق: [{q:سؤال,a:جواب}]"; break;
        case "meta_title": prompt = "اقترح عنوان SEO (Meta Title) للمقال بعنوان: " + (title || "موضوع"); break;
        case "meta_desc": prompt = "اكتب وصف SEO (Meta Description) للمقال بعنوان: " + (title || "موضوع"); break;'

if ($content.Contains($old1)) { $content = $content.Replace($old1, $new1); "Fix 1 applied" } else { "Fix 1: pattern not found" }

# Fix 2: pushDataToGitHub - change articles path to blog/category-slug/article-slug
$old2 = 'const articlePromises = articles.map(async (a) => {
          const folder = "articles/" + a.slug;
          let html = generateArticleHTML(a);
          await commitFile(folder + "/index.html", html);
          if (a.imageData && a.imageData.startsWith("data:")) {
            const imgPath = a.image && getFolder(a.image) ? a.image : "articles/" + a.slug + "/img/default.png";
            const imgFolder = getFolder(imgPath);'

$new2 = 'const articlePromises = articles.map(async (a) => {
          const cat = categories.find(x => x.id === a.category) || { slug: "general" };
          const folder = "blog/" + cat.slug + "/" + a.slug;
          let html = generateArticleHTML(a);
          await commitFile(folder + "/index.html", html);
          if (a.imageData && a.imageData.startsWith("data:")) {
            const imgPath = a.image && getFolder(a.image) ? a.image : "blog/" + cat.slug + "/" + a.slug + "/img/default.png";
            const imgFolder = getFolder(imgPath);'

if ($content.Contains($old2)) { $content = $content.Replace($old2, $new2); "Fix 2 applied" } else { "Fix 2: pattern not found" }

# Fix 3: pushDataToGitHub - change category path from "category/slug" to "blog/slug"
$old3 = 'const categoryPromises = categories.map(async (c) => {
          await commitFile("category/" + c.slug + "/index.html", generateCategoryPage(c));
        });'

$new3 = 'const categoryPromises = categories.map(async (c) => {
          const catArticles = articles.filter(a => a.category === c.id);
          const catArticleCards = catArticles.map(a => {
            return "<div class=card><div class=card-body><h3><a href=../" + c.slug + "/" + a.slug + ">" + a.title + "</a></h3><div class=card-meta><span>" + a.date + "</span></div></div></div>";
          }).join("");
          await commitFile("blog/" + c.slug + "/index.html", generateCategoryPage(c));
        });'

if ($content.Contains($old3)) { $content = $content.Replace($old3, $new3); "Fix 3 applied" } else { "Fix 3: pattern not found" }

# Fix 4: generateBlogHomepage - change article link from articles/slug to blog/cat-slug/article-slug
$old4 = 'const articleCards = articles.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(a => {
        const c = categories.find(x => x.id === a.category) || { name: a.category, color: '"'"'#6366f1'"'"' };
        return '"'"'<div class="card"><img class="card-img" src="'"'"' + (a.image && a.image !== '"'"'undefined'"'"' ? a.image : '"'"'text-tools/img/default.png'"'"') + '"'"' onerror="this.src='"'"' + "'"'"''"'"' + '"'"'text-tools/img/default.png'"'"' + "'"'"''"'"' + '"'"' alt="'"'"' + a.title + '"'"'"><div class="card-body"><span class="card-category" style="background:'"'"' + c.color + '"'"'30;color:'"'"' + c.color + '"'"'">'"'"' + c.name + '"'"'</span><h3><a href="articles/'"'"' + a.slug + '"'"'">'"'"' + a.title + '"'"'</a></h3><p>'"'"' + (a.excerpt || '"'"''"'"').substring(0, 120) + '"'"'...</p><div class="card-meta"><span>'"'"' + a.date + '"'"'</span><span>'"'"' + (a.readTime || 3) + '"'"' دقائق قراءة</span></div></div></div>'"'"';'

That string is hard to match. Let me try a simpler approach - just replace the URLs directly.

# Simpler: fix the category link in generateBlogHomepage
if ($content.Contains('href="category/')) { $content = $content.Replace('href="category/', 'href="blog/'); "Fix 4a applied" } else { "Fix 4a: not found" }

# Fix article links in blog homepage - need to include category slug
# Pattern: href="articles/ + a.slug + " 
# This appears in generateBlogHomepage
$old4b = 'href="articles/' + "'" + '"' + "'" + ' + a.slug + ' + "'" + '"' + "'" + '"'
# That's getting complex. Let me just replace the specific patterns.

# Replace "articles/" in the template generators with "blog/{{cat}}/" is complex due to string concatenation
# Let me just find and replace the exact patterns

# In generateBlogHomepage: href="articles/' + a.slug + '"
$old_link1 = 'href="articles/'
$new_link1 = 'href="blog/'
# But this won't work because we need cat slug in the middle
# We need to replace the whole line

# Let me find the exact article link pattern in the file
"Looking for patterns..."
$patterns = @(
    'articles/' + "'" + '+'
)
foreach ($p in $patterns) {
    $idx = $content.IndexOf($p)
    if ($idx -ge 0) { "Found at $idx : ${p}" } else { "Not found: ${p}" }
}

# Actually let me just replace "articles/" with a placeholder first
# Then fix in template generators
"Searching for href=articles/..."
$idx = $content.IndexOf('href="articles/')
if ($idx -ge 0) {
    $fragment = $content.Substring($idx, 120)
    "First match: $fragment"
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
"Written to file"
