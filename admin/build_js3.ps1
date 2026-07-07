$path = "C:\Users\pc\Documents\GitHub\blog\admin\dashboard.html"
$js3 = @'
    const homeCSS = [
      ":root{--primary:#6366f1;--primary-dark:#4f46e5;--bg:#0f0f1a;--card-bg:rgba(255,255,255,0.05);--text:#e2e8f0;--text-muted:#94a3b8;--border:rgba(255,255,255,0.1)}",
      "*{margin:0;padding:0;box-sizing:border-box}",
      "body{font-family:Tajawal,sans-serif;background:var(--bg);color:var(--text);direction:rtl;min-height:100vh}",
      ".container{max-width:1200px;margin:0 auto;padding:20px}",
      "header{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border)}",
      ".logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,var(--primary),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}",
      "nav a{color:var(--text-muted);text-decoration:none;margin:0 15px;font-size:16px;transition:color .3s}",
      "nav a:hover{color:var(--primary)}",
      ".hero{text-align:center;padding:80px 20px}",
      ".hero h1{font-size:48px;margin-bottom:20px;background:linear-gradient(135deg,var(--text),var(--primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent}",
      ".hero p{font-size:18px;color:var(--text-muted);max-width:600px;margin:0 auto 30px}",
      ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:25px;padding:20px 0}",
      ".card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:transform .3s,box-shadow .3s}",
      ".card:hover{transform:translateY(-5px);box-shadow:0 10px 40px rgba(99,102,241,.2)}",
      ".card-img{width:100%;height:200px;object-fit:cover}",
      ".card-body{padding:20px}",
      ".card-category{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;margin-bottom:10px}",
      ".card h3{font-size:20px;margin-bottom:10px}",
      ".card h3 a{color:var(--text);text-decoration:none}",
      ".card h3 a:hover{color:var(--primary)}",
      ".card p{color:var(--text-muted);font-size:14px;line-height:1.6}",
      ".card-meta{display:flex;justify-content:space-between;margin-top:15px;font-size:12px;color:var(--text-muted)}",
      "footer{text-align:center;padding:30px;border-top:1px solid var(--border);margin-top:60px;color:var(--text-muted)}"
    ];
    const articleCSS = [
      ":root{--primary:#6366f1;--primary-dark:#4f46e5;--bg:#0f0f1a;--card-bg:rgba(255,255,255,0.05);--text:#e2e8f0;--text-muted:#94a3b8;--border:rgba(255,255,255,0.1)}",
      "*{margin:0;padding:0;box-sizing:border-box}",
      "body{font-family:Tajawal,sans-serif;background:var(--bg);color:var(--text);direction:rtl;line-height:1.8}",
      ".container{max-width:800px;margin:0 auto;padding:20px}",
      "header{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:40px}",
      ".logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,var(--primary),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none}",
      "nav a{color:var(--text-muted);text-decoration:none;margin:0 10px}",
      "nav a:hover{color:var(--primary)}",
      "article img{width:100%;border-radius:16px;margin:20px 0}",
      "article h1{font-size:36px;margin-bottom:20px;line-height:1.3}",
      "article .meta{display:flex;gap:20px;color:var(--text-muted);font-size:14px;margin-bottom:30px}",
      "article h2{font-size:24px;margin:30px 0 15px;color:var(--primary)}",
      "article h3{font-size:20px;margin:20px 0 10px}",
      "article p{font-size:16px;margin-bottom:15px;color:var(--text-muted)}",
      "article ul,article ol{margin:15px 0;padding-right:20px;color:var(--text-muted)}",
      "article li{margin-bottom:8px}",
      ".highlight{color:var(--primary);font-weight:700}",
      ".faq-section{margin:40px 0}",
      ".faq-section h2{margin-bottom:20px}",
      ".faq-item{border:1px solid var(--border);border-radius:12px;padding:15px;margin-bottom:10px}",
      ".faq-item h4{font-size:16px;margin-bottom:5px;color:var(--text)}",
      ".faq-item p{font-size:14px;color:var(--text-muted);margin:0}",
      "footer{text-align:center;padding:30px;border-top:1px solid var(--border);margin-top:60px;color:var(--text-muted)}"
    ];
    const categoryCSS = [
      ":root{--primary:#6366f1;--primary-dark:#4f46e5;--bg:#0f0f1a;--card-bg:rgba(255,255,255,0.05);--text:#e2e8f0;--text-muted:#94a3b8;--border:rgba(255,255,255,0.1)}",
      "*{margin:0;padding:0;box-sizing:border-box}",
      "body{font-family:Tajawal,sans-serif;background:var(--bg);color:var(--text);direction:rtl;min-height:100vh}",
      ".container{max-width:1200px;margin:0 auto;padding:20px}",
      "header{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:40px}",
      ".logo{font-size:24px;font-weight:700;background:linear-gradient(135deg,var(--primary),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none}",
      "nav a{color:var(--text-muted);text-decoration:none;margin:0 10px}",
      "nav a:hover{color:var(--primary)}",
      ".cat-header{text-align:center;padding:40px 0}",
      ".cat-header h1{font-size:36px;margin-bottom:10px}",
      ".cat-header p{color:var(--text-muted);font-size:16px}",
      ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:25px;padding:20px 0}",
      ".card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:transform .3s,box-shadow .3s}",
      ".card:hover{transform:translateY(-5px);box-shadow:0 10px 40px rgba(99,102,241,.2)}",
      ".card-img{width:100%;height:200px;object-fit:cover}",
      ".card-body{padding:20px}",
      ".card h3{font-size:20px;margin-bottom:10px}",
      ".card h3 a{color:var(--text);text-decoration:none}",
      ".card h3 a:hover{color:var(--primary)}",
      ".card p{color:var(--text-muted);font-size:14px;line-height:1.6}",
      ".card-meta{display:flex;justify-content:space-between;margin-top:15px;font-size:12px;color:var(--text-muted)}",
      "footer{text-align:center;padding:30px;border-top:1px solid var(--border);margin-top:60px;color:var(--text-muted)}"
    ];

    function generateBlogHomepage() {
      const catCards = categories.map(c => {
        const count = articles.filter(a => a.category === c.id).length;
        return '<div class="card" style="text-align:center;padding:30px"><div style="width:50px;height:50px;border-radius:50%;background:' + c.color + '40;display:flex;align-items:center;justify-content:center;margin:0 auto 15px"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + c.color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (c.svgIcon || '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>') + '</svg></div><h3><a href="category/' + c.slug + '">' + c.name + '</a></h3><p style="color:var(--text-muted);font-size:14px">' + count + ' مقال' + (count !== 1 ? 'ات' : '') + '</p></div>';
      }).join('');
      const articleCards = articles.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(a => {
        const c = categories.find(x => x.id === a.category) || { name: a.category, color: '#6366f1' };
        return '<div class="card"><img class="card-img" src="' + (a.image && a.image !== 'undefined' ? a.image : 'text-tools/img/default.png') + '" onerror="this.src=' + "'" + 'text-tools/img/default.png' + "'" + '" alt="' + a.title + '"><div class="card-body"><span class="card-category" style="background:' + c.color + '30;color:' + c.color + '">' + c.name + '</span><h3><a href="articles/' + a.slug + '">' + a.title + '</a></h3><p>' + (a.excerpt || '').substring(0, 120) + '...</p><div class="card-meta"><span>' + a.date + '</span><span>' + (a.readTime || 3) + ' دقائق قراءة</span></div></div></div>';
      }).join('');
      const siteName = settings.site_name || 'المدونة';
      const siteDesc = settings.site_description || 'مدونة عربية';
      const homeTitle = settings.metaTitle || siteName;
      const homeDesc = settings.metaDesc || siteDesc;
      return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + homeTitle + '</title><meta name="description" content="' + homeDesc + '"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"><style>' + homeCSS.join('') + '</style></head><body><div class="container"><header><a href="/" class="logo">' + siteName + '</a><nav><a href="/">الرئيسية</a>' + categories.map(c => '<a href="category/' + c.slug + '">' + c.name + '</a>').join('') + '</nav></header><section class="hero"><h1>' + siteName + '</h1><p>' + siteDesc + '</p></section><h2 style="margin:30px 0 10px;font-size:28px">الأقسام</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">' + catCards + '</div><h2 style="margin:30px 0 10px;font-size:28px">أحدث المقالات</h2><div class="grid">' + articleCards + '</div></div><footer><p>جميع الحقوق محفوظة &copy; 2026 ' + siteName + '</p></footer></body></html>';
    }

    function generateArticlePage(article) {
      const c = categories.find(x => x.id === article.category) || { name: article.category, color: '#6366f1' };
      const siteName = settings.site_name || 'المدونة';
      const related = articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);
      const relatedHTML = related.length ? '<h2 style="margin:40px 0 20px">مقالات ذات صلة</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px">' + related.map(r => {
        const rc = categories.find(x => x.id === r.category) || { name: r.category, color: '#6366f1' };
        return '<div class="card"><div class="card-body"><span class="card-category" style="background:' + rc.color + '30;color:' + rc.color + '">' + rc.name + '</span><h3><a href="../articles/' + r.slug + '">' + r.title + '</a></h3><div class="card-meta"><span>' + r.date + '</span></div></div></div>';
      }).join('') + '</div>' : '';
      const faqHTML = article.faq && article.faq.length ? '<div class="faq-section"><h2>الأسئلة الشائعة</h2>' + article.faq.map(f => '<div class="faq-item"><h4>' + f.q + '</h4><p>' + f.a + '</p></div>').join('') + '</div>' : '';
      const imgSrc = article.image && article.image !== 'undefined' ? '../' + article.image : '../text-tools/img/default.png';
      return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + (article.metaTitle || article.title) + ' - ' + siteName + '</title><meta name="description" content="' + (article.metaDesc || article.excerpt || '') + '"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"><style>' + articleCSS.join('') + '</style></head><body><div class="container"><header><a href="../" class="logo">' + siteName + '</a><nav><a href="../">الرئيسية</a><a href="../category/' + c.slug + '">' + c.name + '</a></nav></header><article><h1>' + article.title + '</h1><div class="meta"><span>📅 ' + article.date + '</span><span>👤 ' + (article.author || 'Toolrar') + '</span><span>⏱ ' + (article.readTime || 3) + ' دقائق قراءة</span></div><img src="' + imgSrc + '" alt="' + (article.imageAlt || article.title) + '" title="' + (article.imageTitle || article.title) + '" onerror="this.src=' + "'" + '../text-tools/img/default.png' + "'" + '">' + article.content + faqHTML + '</article>' + relatedHTML + '</div><footer><p>جميع الحقوق محفوظة &copy; 2026 <a href="../" style="color:var(--primary);text-decoration:none">' + siteName + '</a></p></footer></body></html>';
    }

    function generateCategoryPage(cat) {
      const siteName = settings.site_name || 'المدونة';
      const catArticles = articles.filter(a => a.category === cat.id);
      const articleCards = catArticles.map(a => {
        return '<div class="card"><img class="card-img" src="' + (a.image && a.image !== 'undefined' ? '../' + a.image : '../text-tools/img/default.png') + '" onerror="this.src=' + "'" + '../text-tools/img/default.png' + "'" + '" alt="' + a.title + '"><div class="card-body"><h3><a href="../articles/' + a.slug + '">' + a.title + '</a></h3><p>' + (a.excerpt || '').substring(0, 120) + '...</p><div class="card-meta"><span>' + a.date + '</span><span>' + (a.readTime || 3) + ' دقائق قراءة</span></div></div></div>';
      }).join('');
      return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + cat.name + ' - ' + siteName + '</title><meta name="description" content="' + (cat.description || 'تصفح مقالات قسم ' + cat.name) + '"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"><style>' + categoryCSS.join('') + '</style></head><body><div class="container"><header><a href="../" class="logo">' + siteName + '</a><nav><a href="../">الرئيسية</a></nav></header><div class="cat-header"><h1 style="color:' + cat.color + '">' + cat.name + '</h1><p>' + (cat.description || 'جميع المقالات في هذا القسم') + '</p></div><div class="grid">' + articleCards + '</div></div><footer><p>جميع الحقوق محفوظة &copy; 2026 <a href="../" style="color:var(--primary);text-decoration:none">' + siteName + '</a></p></footer></body></html>';
    }

    function generateArticleHTML(article) {
      return generateArticlePage(article);
    }

    async function commitFileToGitHub(filePath, content, repo, branch, token) {
      const api = "https://api.github.com/repos/" + repo + "/contents/" + filePath;
      const encoded = btoa(unescape(encodeURIComponent(content)));
      let sha = "";
      try {
        const r = await fetch(api + "?ref=" + branch, { headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github.v3+json" } });
        if (r.ok) { const d = await r.json(); sha = d.sha; }
      } catch (_) {}
      const body = { message: "update " + filePath, content: encoded, branch };
      if (sha) body.sha = sha;
      return fetch(api, { method: "PUT", headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
  </script>
</body>
</html>
'@
$js3 | Add-Content -Path $path -Encoding UTF8
