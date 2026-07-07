Add-Content -Path "C:\Users\pc\Documents\GitHub\blog\admin\dashboard.html" -Value '<script>
    if (localStorage.getItem("tr_logged_in") !== "true") { window.location.href = "index.html"; }
    let articles = [], categories = [], settings = {};

    window.addEventListener("DOMContentLoaded", async () => {
      if (localStorage.getItem("tr_theme") === "light") {
        document.body.classList.add("light-mode");
        document.getElementById("themeIcon").innerHTML = "<circle cx=\"12\" cy=\"12\" r=\"4\"></circle><path d=\"M12 2v2\"></path><path d=\"M12 20v2\"></path><path d=\"m4.93 4.93 1.41 1.41\"></path><path d=\"m17.66 17.66 1.41 1.41\"></path><path d=\"M2 12h2\"></path><path d=\"M20 12h2\"></path><path d=\"m6.34 17.66-1.41 1.41\"></path><path d=\"m19.07 4.93-1.41 1.41\"></path>";
      }
      tinymce.init({
        selector: "#postContent", language: "ar", directionality: "rtl",
        plugins: "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
        toolbar: "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
        height: 400
      });
      await loadInitialData();
      loadAIModels();
    });

    function toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("open");
      document.getElementById("sidebarOverlay").classList.toggle("show");
    }

    function toggleTheme() {
      document.body.classList.toggle("light-mode");
      const isLight = document.body.classList.contains("light-mode");
      localStorage.setItem("tr_theme", isLight ? "light" : "dark");
      const ti = document.getElementById("themeIcon");
      if (isLight) {
        ti.innerHTML = "<circle cx=\"12\" cy=\"12\" r=\"4\"></circle><path d=\"M12 2v2\"></path><path d=\"M12 20v2\"></path><path d=\"m4.93 4.93 1.41 1.41\"></path><path d=\"m17.66 17.66 1.41 1.41\"></path><path d=\"M2 12h2\"></path><path d=\"M20 12h2\"></path><path d=\"m6.34 17.66-1.41 1.41\"></path><path d=\"m19.07 4.93-1.41 1.41\"></path>";
      } else {
        ti.innerHTML = "<path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path>";
      }
    }

    function switchTab(tabId) {
      document.querySelectorAll(".tab-content").forEach(e => e.classList.remove("active"));
      document.querySelectorAll(".nav-item").forEach(e => e.classList.remove("active"));
      document.getElementById("tab-" + tabId).classList.add("active");
      const nav = Array.from(document.querySelectorAll(".nav-item")).find(i => i.getAttribute("data-tab") === tabId);
      if (nav) nav.classList.add("active");
      const titles = { dashboard: "الرئيسية", "add-article": "إضافة مقال", articles: "المقالات", categories: "الأقسام", settings: "الإعدادات" };
      document.getElementById("pageTitle").textContent = titles[tabId] || "لوحة التحكم";
    }

    document.querySelectorAll(".nav-item").forEach(i => {
      i.addEventListener("click", () => switchTab(i.getAttribute("data-tab")));
    });

    function showToast(message, type) {
      const toast = document.getElementById("toastBox");
      const msg = document.getElementById("toastMsg");
      const icon = document.getElementById("toastIcon");
      msg.textContent = message;
      icon.textContent = type === "success" ? "⚡" : "⚠️";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3500);
    }

    const aiModelsList = {
      google: [
        { id: "gemini-2.5-flash", name: "gemini-2.5-flash (أحدث نموذج سريع)" },
        { id: "gemini-2.5-pro", name: "gemini-2.5-pro (ذكاء فائق)" },
        { id: "gemini-2.0-flash", name: "gemini-2.0-flash (سريع جداً)" },
        { id: "gemini-2.0-flash-thinking-exp", name: "gemini-2.0-flash-thinking-exp (تفكير عميق)" },
        { id: "gemini-1.5-flash", name: "gemini-1.5-flash (افتراضي)" },
        { id: "gemini-1.5-pro", name: "gemini-1.5-pro (تحليل عميق)" }
      ],
      opencode: [
        { id: "qwen3.6-plus-free", name: "qwen3.6-plus-free (كوين 3.6 بلس)" },
        { id: "deepseek-v4-flash-free", name: "deepseek-v4-flash-free (ديب سيك V4)" },
        { id: "minimax-m3-free", name: "minimax-m3-free (مينيمكس 3)" },
        { id: "mimo-v2.5-free", name: "mimo-v2.5-free (ميمو 2.5)" },
        { id: "big-pickle", name: "big-pickle (بيج بيكل)" },
        { id: "nemotron-3-ultra-free", name: "nemotron-3-ultra-free (نيموترون الترا)" },
        { id: "nemotron-3-super-free", name: "nemotron-3-super-free (نيموترون)" }
      ],
      openrouter: [
        { id: "deepseek/deepseek-v4-flash:free", name: "DeepSeek V4 Flash (free)" },
        { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (free)" },
        { id: "moonshotai/kimi-k2.6:free", name: "Kimi K2.6 (free)" },
        { id: "poolside/laguna-m.1:free", name: "Laguna M.1 (free)" },
        { id: "poolside/laguna-xs.2:free", name: "Laguna XS.2 (free)" },
        { id: "openai/gpt-oss-120b:free", name: "GPT-OSS-120B (free)" }
      ],
      groq: [
        { id: "llama-3.3-70b-versatile", name: "llama-3.3-70b-versatile (ميتا)" },
        { id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b" },
        { id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b" },
        { id: "qwen-2.5-coder-32b", name: "qwen-2.5-coder-32b (برمجة)" },
        { id: "llama-3.1-8b-instant", name: "llama-3.1-8b-instant" },
        { id: "mixtral-8x7b-32768", name: "mixtral-8x7b-32768" },
        { id: "gemma2-9b-it", name: "gemma2-9b-it" }
      ],
      cerebras: [
        { id: "gpt-oss-120b", name: "gpt-oss-120b (استدلال فائق السرعة)" },
        { id: "zai-glm-4.7", name: "zai-glm-4.7 (محادثة ذكية)" }
      ],
      siliconflow: [
        { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek-R1 (برمجة/تفكير)" },
        { id: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek-V4-Pro (برمجة)" },
        { id: "deepseek-ai/DeepSeek-V4-Flash", name: "DeepSeek-V4-Flash (سريع)" },
        { id: "zai-org/GLM-5.1", name: "GLM-5.1 (برمجة)" },
        { id: "deepseek-ai/DeepSeek-V3.2", name: "DeepSeek-V3.2" },
        { id: "zai-org/GLM-5", name: "GLM-5" },
        { id: "deepseek-ai/DeepSeek-V3.1", name: "DeepSeek-V3.1" },
        { id: "Qwen/Qwen3-Coder-30B-A3B-Instruct", name: "Qwen3-Coder-30B" },
        { id: "Qwen/Qwen3-32B", name: "Qwen3-32B" },
        { id: "google/gemma-4-31B-it", name: "Gemma-4-31B" },
        { id: "MiniMaxAI/MiniMax-M3", name: "MiniMax-M3" },
        { id: "moonshotai/Kimi-K2.6", name: "Kimi-K2.6" },
        { id: "openai/gpt-oss-120b", name: "GPT-OSS-120B" },
        { id: "Qwen/Qwen3-14B", name: "Qwen3-14B" }
      ],
      routeway: [
        { id: "deepseek-v4-flash:free", name: "DeepSeek V4 Flash" },
        { id: "llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
        { id: "nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano" },
        { id: "gpt-oss-120b:free", name: "GPT-OSS 120B" },
        { id: "step-3.5-flash:free", name: "Step 3.5 Flash" }
      ],
      github: [{ id: "openai/gpt-4.1", name: "GPT-4.1" }],
      featherless: [{ id: "zai-org/GLM-5.1", name: "GLM-5.1" }]
    };

    function loadAIModels() {
      const provider = document.getElementById("aiProvider").value;
      const select = document.getElementById("aiModel");
      select.innerHTML = "";
      (aiModelsList[provider] || []).forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        select.appendChild(opt);
      });
    }

    async function loadInitialData() {
      try { const r = await fetch("data/categories.json"); const d = await r.json(); categories = d.categories || []; }
      catch (e) { categories = JSON.parse(localStorage.getItem("tr_categories")) || []; }
      try { const r = await fetch("data/articles.json"); const d = await r.json(); articles = d.articles || []; }
      catch (e) { articles = JSON.parse(localStorage.getItem("tr_articles")) || []; }
      try {
        const r = await fetch("data/settings.json");
        const d = await r.json();
        const s = JSON.parse(localStorage.getItem("tr_settings")) || {};
        settings = { ...d, ...s };
        if (!localStorage.getItem("tr_settings")) localStorage.setItem("tr_settings", JSON.stringify(settings));
      } catch (e) { settings = JSON.parse(localStorage.getItem("tr_settings")) || {}; }
      populateDashboard(); populateSettings(); populateCategoriesList();
      populateArticlesList(); updateCategoryDropdowns(); checkGitHubConfiguration();
    }

    function checkGitHubConfiguration() {
      const text = document.getElementById("gitSyncText");
      const pill = document.getElementById("gitSyncPill");
      if (settings.github_repo && settings.github_token) {
        text.textContent = "متصل: " + settings.github_repo;
        pill.classList.remove("offline");
        document.getElementById("lastSyncTime").textContent = "جاهز للمزامنة";
      } else {
        text.textContent = "محلي (غير مربوط بـ GitHub)";
        pill.classList.add("offline");
        document.getElementById("lastSyncTime").textContent = "غير متصل";
      }
    }

    function populateDashboard() {
      document.getElementById("countArticles").textContent = articles.length;
      document.getElementById("countCategories").textContent = categories.length;
      const list = document.getElementById("latestArticlesList");
      list.innerHTML = "";
      const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      if (sorted.length === 0) {
        list.innerHTML = "<tr><td colspan=\"4\" style=\"text-align:center;padding:20px\">لا يوجد مقالات مضافة بعد.</td></tr>";
        return;
      }
      sorted.forEach(a => {
        const c = categories.find(x => x.id === a.category) || { name: a.category };
        const tr = document.createElement("tr");
        tr.innerHTML = "<td><div class=\"article-row-meta\"><img class=\"article-thumb\" src=\"" + (a.image ? "../blog/" + a.image : "../blog/text-tools/img/default.png") + "\" onerror=\"this.src='../blog/text-tools/img/default.png'\"><span>" + a.title + "</span></div></td><td>" + c.name + "</td><td>" + a.date + "</td><td><span style=\"color:var(--success);font-weight:700\">منشور</span></td>";
        list.appendChild(tr);
      });
    }

    function populateSettings() {
      document.getElementById("githubRepo").value = settings.github_repo || "";
      document.getElementById("githubBranch").value = settings.github_branch || "main";
      document.getElementById("githubToken").value = settings.github_token || "";
      document.getElementById("keyOpenrouter").value = settings.openrouter_key || "";
      document.getElementById("keyGoogle").value = settings.google_key || "";
      document.getElementById("keyGroq").value = settings.groq_key || "";
      document.getElementById("keyCerebras").value = settings.cerebras_key || "";
      document.getElementById("keySiliconflow").value = settings.siliconflow_key || "";
      document.getElementById("keyRouteway").value = settings.routeway_key || "";
      document.getElementById("keyFeatherless").value = settings.featherless_key || "";
      document.getElementById("keyGithubAi").value = settings.github_ai_key || "";
      document.getElementById("keyOpencode").value = settings.opencode_key || "";
      document.getElementById("keyNetlifyApi").value = settings.netlify_api_key || "";
      document.getElementById("keyNetlifySite").value = settings.netlify_site_id || "";
      document.getElementById("siteName").value = settings.site_name || "";
      document.getElementById("siteDescription").value = settings.site_description || "";
      document.getElementById("blogUrl").value = settings.blog_url || "";
    }

    function updateCategoryDropdowns() {
      const select = document.getElementById("postCategory");
      select.innerHTML = "";
      categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id; opt.textContent = c.name; select.appendChild(opt);
      });
    }

    function populateCategoriesList() {
      const list = document.getElementById("allCategoriesList");
      list.innerHTML = "";
      categories.forEach(c => {
        const count = articles.filter(a => a.category === c.id).length;
        const tr = document.createElement("tr");
        tr.innerHTML = "<td><div style=\"display:flex;align-items:center;gap:10px\"><span style=\"width:16px;height:16px;border-radius:50%;background:" + c.color + "\"></span><strong>" + c.name + "</strong></div></td><td><code>" + c.slug + "</code></td><td>" + count + "</td><td><button class=\"btn-action edit\" onclick=\"editCategory('" + c.id + "')\">تعديل</button> <button class=\"btn-action delete\" onclick=\"deleteCategory('" + c.id + "')\">حذف</button></td>";
        list.appendChild(tr);
      });
    }

    function populateArticlesList() {
      const list = document.getElementById("allArticlesList");
      list.innerHTML = "";
      if (articles.length === 0) {
        list.innerHTML = "<tr><td colspan=\"5\" style=\"text-align:center;padding:30px\">لا يوجد أي مقالات حالياً.</td></tr>";
        return;
      }
      articles.forEach(a => {
        const c = categories.find(x => x.id === a.category) || { name: a.category };
        const tr = document.createElement("tr");
        tr.innerHTML = "<td><div class=\"article-row-meta\"><img class=\"article-thumb\" src=\"" + (a.image ? "../blog/" + a.image : "../blog/text-tools/img/default.png") + "\" onerror=\"this.src='../blog/text-tools/img/default.png'\"><strong>" + a.title + "</strong></div></td><td>" + c.name + "</td><td>" + a.date + "</td><td><span style=\"color:var(--success);font-weight:700\">منشور</span></td><td><button class=\"btn-action edit\" onclick=\"editArticle('" + a.id + "')\">تعديل</button> <button class=\"btn-action delete\" onclick=\"deleteArticle('" + a.id + "')\">حذف</button></td>";
        list.appendChild(tr);
      });
    }

    function generateSlugFromTitle() { document.getElementById("postSlug").value = slugify(document.getElementById("postTitle").value); }
    function generateSlugFromCatName() { document.getElementById("catSlug").value = slugify(document.getElementById("catName").value); }
    function slugify(t) { return t.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\u0621-\u064A\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""); }

    function previewPostImage(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById("postImagePreview");
        preview.src = e.target.result;
        preview.style.display = "block";
        document.getElementById("postImageData").value = e.target.result;
        const cat = document.getElementById("postCategory").value;
        const slug = document.getElementById("postSlug").value || "image";
        document.getElementById("postImagePath").value = cat + "/img/" + slug + ".png";
        document.getElementById("imageAlt").value = document.getElementById("postTitle").value;
        document.getElementById("imageTitle").value = document.getElementById("postTitle").value;
      };
      reader.readAsDataURL(file);
    }

    function addFaqRow(q, a) {
      q = q || ""; a = a || "";
      const container = document.getElementById("faqContainer");
      const div = document.createElement("div"); div.className = "faq-item-form";
      div.innerHTML = "<input type=\"text\" class=\"input-custom faq-q\" style=\"flex:1\" placeholder=\"السؤال\" value=\"" + q + "\"><input type=\"text\" class=\"input-custom faq-a\" style=\"flex:2\" placeholder=\"الإجابة\" value=\"" + a + "\"><button type=\"button\" class=\"btn-action delete\" onclick=\"this.parentElement.remove()\" style=\"padding:12px\">X</button>";
      container.appendChild(div);
    }

    function clearArticleForm() {
      ["editArticleId", "postTitle", "postSlug", "postExcerpt", "postImagePath", "postImageData", "imageAlt", "imageTitle", "metaTitle", "metaDesc"].forEach(id => document.getElementById(id).value = "");
      document.getElementById("faqContainer").innerHTML = "";
      document.getElementById("postImagePreview").style.display = "none";
      if (tinymce.get("postContent")) tinymce.get("postContent").setContent("");
    }

    function editArticle(id) {
      const a = articles.find(x => x.id === id);
      if (!a) return;
      clearArticleForm();
      switchTab("add-article");
      document.getElementById("editArticleId").value = a.id;
      document.getElementById("postTitle").value = a.title;
      document.getElementById("postSlug").value = a.slug;
      document.getElementById("postCategory").value = a.category;
      document.getElementById("postExcerpt").value = a.excerpt;
      document.getElementById("postImagePath").value = a.image || "";
      document.getElementById("postImageData").value = a.imageData || "";
      document.getElementById("imageAlt").value = a.imageAlt || "";
      document.getElementById("imageTitle").value = a.imageTitle || "";
      document.getElementById("metaTitle").value = a.metaTitle || "";
      document.getElementById("metaDesc").value = a.metaDesc || "";
      if (a.imageData) {
        document.getElementById("postImagePreview").src = a.imageData;
        document.getElementById("postImagePreview").style.display = "block";
      } else if (a.image) {
        document.getElementById("postImagePreview").src = "../blog/" + a.image;
        document.getElementById("postImagePreview").style.display = "block";
      }
      if (a.faq && Array.isArray(a.faq)) a.faq.forEach(f => addFaqRow(f.q, f.a));
      setTimeout(() => { if (tinymce.get("postContent")) tinymce.get("postContent").setContent(a.content || ""); }, 300);
    }

    async function deleteArticle(id) {
      if (!confirm("هل أنت متأكد من حذف هذا المقال نهائياً؟")) return;
      const i = articles.findIndex(a => a.id === id);
      if (i === -1) return;
      articles.splice(i, 1);
      saveDataToLocalStorage();
      populateDashboard();
      populateArticlesList();
      showToast("تم حذف المقال بنجاح", "success");
      await pushDataToGitHub();
    }

    async function saveArticle(e) {
      e.preventDefault();
      const id = document.getElementById("editArticleId").value || "art_" + Date.now();
      const title = document.getElementById("postTitle").value;
      const slug = document.getElementById("postSlug").value;
      const category = document.getElementById("postCategory").value;
      const excerpt = document.getElementById("postExcerpt").value;
      const image = document.getElementById("postImagePath").value;
      const imageAlt = document.getElementById("imageAlt").value;
      const imageTitle = document.getElementById("imageTitle").value;
      const metaTitleVal = document.getElementById("metaTitle").value || title;
      const metaDescVal = document.getElementById("metaDesc").value || excerpt;
      const content = tinymce.get("postContent") ? tinymce.get("postContent").getContent() : document.getElementById("postContent").value;
      const faqRows = document.querySelectorAll(".faq-item-form");
      const faq = [];
      faqRows.forEach(r => { const q = r.querySelector(".faq-q").value; const a = r.querySelector(".faq-a").value; if (q && a) faq.push({ q, a }); });
      const imageData = document.getElementById("postImageData").value;
      const data = {
        id, title, slug, category, excerpt, content,
        image: image || category + "/img/default.png", imageData: imageData || "",
        imageAlt, imageTitle, metaTitle: metaTitleVal, metaDesc: metaDescVal,
        author: "Toolrar", date: new Date().toISOString().split("T")[0],
        readTime: Math.max(1, Math.ceil(content.split(" ").length / 200)),
        faq, status: "published",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      const idx = articles.findIndex(a => a.id === id);
      if (idx > -1) { data.createdAt = articles[idx].createdAt; articles[idx] = data; }
      else { articles.push(data); }
      saveDataToLocalStorage(); populateDashboard(); populateArticlesList();
      switchTab("articles"); showToast("تم حفظ المقال بنجاح", "success");
      await pushDataToGitHub();
    }

    function editCategory(id) {
      const c = categories.find(x => x.id === id);
      if (!c) return;
      document.getElementById("editCategoryId").value = c.id;
      document.getElementById("catName").value = c.name;
      document.getElementById("catSlug").value = c.slug;
      document.getElementById("catColor").value = c.color || "#6366f1";
      document.getElementById("catDesc").value = c.description || "";
      document.getElementById("catBoxTitle").textContent = "تعديل القسم";
      document.getElementById("btnCancelCatEdit").style.display = "inline-block";
    }

    function clearCategoryForm() {
      document.getElementById("editCategoryId").value = "";
      document.getElementById("catName").value = "";
      document.getElementById("catSlug").value = "";
      document.getElementById("catColor").value = "#6366f1";
      document.getElementById("catDesc").value = "";
      document.getElementById("catBoxTitle").textContent = "إضافة قسم جديد";
      document.getElementById("btnCancelCatEdit").style.display = "none";
    }

    async function deleteCategory(id) {
      if (!confirm("حذف القسم سيؤدي لإزالة تصنيف مقالاته. هل أنت متأكد؟")) return;
      const i = categories.findIndex(c => c.id === id);
      if (i === -1) return;
      categories.splice(i, 1);
      saveDataToLocalStorage(); populateDashboard(); populateCategoriesList();
      updateCategoryDropdowns(); showToast("تم حذف القسم بنجاح", "success");
      await pushDataToGitHub();
    }

    async function saveCategory(e) {
      e.preventDefault();
      const id = document.getElementById("editCategoryId").value || document.getElementById("catSlug").value;
      const d = {
        id, name: document.getElementById("catName").value, slug: document.getElementById("catSlug").value,
        color: document.getElementById("catColor").value, description: document.getElementById("catDesc").value,
        svgIcon: "<polyline points='4 7 4 4 20 4 20 7'/><line x1='9' y1='20' x2='15' y2='20'/><line x1='12' y1='4' x2='12' y2='20'/>"
      };
      const idx = categories.findIndex(c => c.id === id);
      if (idx > -1) categories[idx] = d; else categories.push(d);
      saveDataToLocalStorage(); populateDashboard(); populateCategoriesList();
      updateCategoryDropdowns(); clearCategoryForm(); showToast("تم حفظ القسم بنجاح", "success");
      await pushDataToGitHub();
    }

    function saveDataToLocalStorage() {
      localStorage.setItem("tr_articles", JSON.stringify(articles));
      localStorage.setItem("tr_categories", JSON.stringify(categories));
    }

    function saveSettings(e) {
      e.preventDefault();
      const ns = {
        github_repo: document.getElementById("githubRepo").value,
        github_branch: document.getElementById("githubBranch").value,
        github_token: document.getElementById("githubToken").value,
        openrouter_key: document.getElementById("keyOpenrouter").value,
        google_key: document.getElementById("keyGoogle").value,
        groq_key: document.getElementById("keyGroq").value,
        cerebras_key: document.getElementById("keyCerebras").value,
        siliconflow_key: document.getElementById("keySiliconflow").value,
        routeway_key: document.getElementById("keyRouteway").value,
        featherless_key: document.getElementById("keyFeatherless").value,
        github_ai_key: document.getElementById("keyGithubAi").value,
        opencode_key: document.getElementById("keyOpencode").value,
        netlify_api_key: document.getElementById("keyNetlifyApi").value,
        netlify_site_id: document.getElementById("keyNetlifySite").value,
        site_name: document.getElementById("siteName").value,
        site_description: document.getElementById("siteDescription").value,
        blog_url: document.getElementById("blogUrl").value
      };
      settings = { ...settings, ...ns };
      localStorage.setItem("tr_settings", JSON.stringify(settings));
      checkGitHubConfiguration();
      showToast("تم حفظ الإعدادات بنجاح", "success");
    }

    function handleLogout() {
      localStorage.removeItem("tr_logged_in");
      localStorage.removeItem("tr_user");
      window.location.href = "index.html";
    }

    const defaultAIKeys = {
      google: "AQ.Ab8RN6KhduQtbtmII7u0ijcaZDzc7xb8iZCTnPETVnZ2F3nfog",
      openrouter: "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",
      groq: "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",
      cerebras: "csk-8hnwewjmfy46xthhwcn3t22n94tt9t349e2rdkw9xvnf28pc",
      siliconflow: "sk-uksfscrxjhaynjmlcpbhcvykqqkukmjwqdidjbvsczsjdsge",
      routeway: "sk-Mrl1csStecbVXviGdJaae157NT5Whg9WVY6ZMqy8wg05AcmJhokX0l9e5SHQjjltcsTlaLhwN8H8HDf1-w5O",
      featherless: "rc_ad3f761e6bcecf4c751c248e549bc2a045438e268d4c995172d338155615db0d",
      github: "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",
      opencode: "sk-KQSYcYOXAr5YDBCzFh7jlVlxoSR5ZI4cnc8y56RlJJ9YjROqQhkmuG6fvKLwsWrR"
    };

    async function callAIAPI(provider, model, promptText) {
      const keys = {
        google: settings.google_key || defaultAIKeys.google,
        openrouter: settings.openrouter_key || defaultAIKeys.openrouter,
        groq: settings.groq_key || defaultAIKeys.groq,
        cerebras: settings.cerebras_key || defaultAIKeys.cerebras,
        siliconflow: settings.siliconflow_key || defaultAIKeys.siliconflow,
        routeway: settings.routeway_key || defaultAIKeys.routeway,
        featherless: settings.featherless_key || defaultAIKeys.featherless,
        github: settings.github_ai_key || defaultAIKeys.github,
        opencode: settings.opencode_key || defaultAIKeys.opencode
      };
      const apiKey = keys[provider];
      if (!apiKey) throw new Error("مفتاح API غير متوفر");
      let url = "", headers = {}, body = {};
      switch (provider) {
        case "openrouter": url = "https://openrouter.ai/api/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "google": url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey; headers = { "Content-Type": "application/json" }; body = { contents: [{ parts: [{ text: promptText }] }] }; break;
        case "groq": url = "https://api.groq.com/openai/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "cerebras": url = "https://api.cerebras.ai/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "siliconflow": url = "https://api.siliconflow.cn/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "routeway": url = "https://api.routeway.ai/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "github": url = "https://models.github.ai/inference/chat/completions"; headers = { "Content-Type": "application/json", "Accept": "application/vnd.github+json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "featherless": url = "https://api.featherless.ai/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
        case "opencode": url = "https://opencode.ai/zen/v1/chat/completions"; headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }; body = { model, messages: [{ role: "user", content: promptText }] }; break;
      }
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (provider === "google") return data.candidates[0].content.parts[0].text;
      return data.choices[0].message.content;
    }

    async function generateWithAI() {
      const provider = document.getElementById("aiProvider").value;
      const model = document.getElementById("aiModel").value;
      const prompt = document.getElementById("aiPrompt").value;
      const target = document.getElementById("aiTarget").value;
      const loading = document.getElementById("aiLoading");
      const resultDiv = document.getElementById("aiResult");
      const output = document.getElementById("aiOutput");
      if (!prompt) { showToast("الرجاء إدخال النص المطلوب", "error"); return; }
      loading.style.display = "block"; resultDiv.style.display = "none";
      const finalPrompt = prompt + "\n\nيرجى الرد بصيغة HTML منسقة بدون علامات ```html أو أية تعليمات إضافية.";
      try {
        const text = await callAIAPI(provider, model, finalPrompt);
        output.innerHTML = text;
        resultDiv.style.display = "block";
        const preview = document.getElementById("aiPreview");
        preview.style.display = "block";
        if (target) {
          const el = document.getElementById(target);
          if (el) {
            if (el.id === "postContent" && tinymce.get("postContent")) {
              tinymce.get("postContent").setContent(text);
            } else if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
              el.value = text;
            } else { el.innerHTML = text; }
          }
        }
        showToast("تم إنشاء المحتوى بنجاح", "success");
      } catch (err) {
        showToast("خطأ: " + err.message, "error");
        output.textContent = "حدث خطأ أثناء الاتصال: " + err.message;
        resultDiv.style.display = "block";
      }
      loading.style.display = "none";
    }

    function insertAIContent() {
      const target = document.getElementById("aiTarget").value;
      if (!target) return;
      const content = document.getElementById("aiOutput").innerHTML;
      const el = document.getElementById(target);
      if (!el) return;
      if (el.id === "postContent" && tinymce.get("postContent")) {
        tinymce.get("postContent").setContent(content);
      } else {
        el.value = content;
      }
      showToast("تم إدراج المحتوى", "success");
    }

    async function generateArticleAI() {
      const title = document.getElementById("postTitle").value;
      if (!title) { showToast("الرجاء كتابة عنوان المقال أولاً", "error"); return; }
      const provider = document.getElementById("aiProvider").value;
      const model = document.getElementById("aiModel").value;
      const loading = document.getElementById("articleGenLoading");
      loading.style.display = "block";
      const prompt = "اكتب مقالاً كاملاً منسقاً HTML باللغة العربية بعنوان: " + title + ".\nالمقال يجب أن يحتوي على: مقدمة، عناوين فرعية (h2, h3)، فقرات، وقائمة من النقاط. استخدم class='highlight' للكلمات المهمة. بدون علامات html أو CSS.";
      try {
        const text = await callAIAPI(provider, model, prompt);
        if (tinymce.get("postContent")) tinymce.get("postContent").setContent(text);
        showToast("تم إنشاء المقال", "success");
      } catch (err) { showToast("خطأ: " + err.message, "error"); }
      loading.style.display = "none";
    }

    function generateArticleSummary() {
      const content = tinymce.get("postContent") ? tinymce.get("postContent").getContent() : "";
      if (!content) { showToast("لا يوجد محتوى", "error"); return; }
      const text = content.replace(/<[^>]+>/g, "").trim();
      const excerpt = text.substring(0, 160) + (text.length > 160 ? "..." : "");
      document.getElementById("postExcerpt").value = excerpt;
      showToast("تم إنشاء الملخص", "success");
    }

    function generateMetaFromContent() {
      const title = document.getElementById("postTitle").value;
      const excerpt = document.getElementById("postExcerpt").value;
      document.getElementById("metaTitle").value = title;
      document.getElementById("metaDesc").value = excerpt || title;
      showToast("تم تعيين البيانات الوصفية", "success");
    }

    function openAITool(tool) {
      const tools = { "writer": "articleGenTool", "analyzer": "seoTool", "rewriter": "rewriteTool", "ideas": "ideasTool" };
      const id = tools[tool] || "aiTool";
      document.getElementById(id).style.display = "block";
      showToast("تم فتح الأداة", "success");
    }

    async function getArticleIdeas() {
      const topic = document.getElementById("ideaTopic").value || "تقنية";
      const provider = document.getElementById("aiProvider").value;
      const model = document.getElementById("aiModel").value;
      const loading = document.getElementById("ideasLoading");
      loading.style.display = "block";
      const prompt = "اقترح 10 أفكار مواضيع مقالات عربية. الموضوع: " + topic + ".\nأعد كل فكرة في سطر منفصل برقم. بدون علامات تنسيق.";
      try {
        const text = await callAIAPI(provider, model, prompt);
        document.getElementById("ideasOutput").innerHTML = "<pre>" + text + "</pre>";
      } catch (err) { showToast("خطأ: " + err.message, "error"); }
      loading.style.display = "none";
    }

    async function analyzeSEO() {
      const content = tinymce.get("postContent") ? tinymce.get("postContent").getContent() : "";
      const text = content.replace(/<[^>]+>/g, "");
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      const chars = text.length;
      const title = document.getElementById("postTitle").value || "";
      const excerpt = document.getElementById("postExcerpt").value || "";
      const metaDesc = document.getElementById("metaDesc").value || "";
      const headingMatches = content.match(/<h[1-6][^>]*>/g) || [];
      const images = content.match(/<img[^>]+>/g) || [];
      let info = "";
      info += "<div class='info-grid'><div class='info-label'>عدد الكلمات</div><div class='info-value'>" + words + "</div></div>";
      info += "<div class='info-grid'><div class='info-label'>عدد الأحرف</div><div class='info-value'>" + chars + "</div></div>";
      info += "<div class='info-grid'><div class='info-label'>العناوين الفرعية</div><div class='info-value'>" + headingMatches.length + "</div></div>";
      info += "<div class='info-grid'><div class='info-label'>الصور</div><div class='info-value'>" + images.length + "</div></div>";
      info += "<div class='info-grid'><div class='info-label'>العنوان</div><div class='info-value'>" + title.length + " حرف</div></div>";
      info += "<div class='info-grid'><div class='info-label'>الملخص</div><div class='info-value'>" + excerpt.length + " حرف</div></div>";
      info += "<div class='info-grid'><div class='info-label'>الوصف الميتا</div><div class='info-value'>" + metaDesc.length + " حرف</div></div>";
      document.getElementById("seoOutput").innerHTML = info;
      document.getElementById("seoOutput").style.display = "block";
    }

    async function rewriteArticle() {
      const content = tinymce.get("postContent") ? tinymce.get("postContent").getContent() : "";
      if (!content) { showToast("لا يوجد محتوى", "error"); return; }
      const style = document.getElementById("rewriteStyle").value;
      const provider = document.getElementById("aiProvider").value;
      const model = document.getElementById("aiModel").value;
      const loading = document.getElementById("rewriteLoading");
      loading.style.display = "block";
      const prompt = "أعد صياغة المحتوى التالي بالأسلوب " + style + " (رسمي، بسيط، أو إبداعي). بدون علامات HTML أو تعليمات:\n\n" + content.substring(0, 3000);
      try {
        const text = await callAIAPI(provider, model, prompt);
        if (tinymce.get("postContent")) tinymce.get("postContent").setContent(text);
        showToast("تمت إعادة الصياغة", "success");
      } catch (err) { showToast("خطأ: " + err.message, "error"); }
      loading.style.display = "none";
    }

    async function pushDataToGitHub() {
      if (!settings.github_repo || !settings.github_token) return;
      const branch = settings.github_branch || "main";
      const token = settings.github_token;
      const repo = settings.github_repo;
      const api = "https://api.github.com/repos/" + repo + "/contents/";
      async function commitFile(filePath, content) {
        const url = api + filePath;
        const encoded = btoa(unescape(encodeURIComponent(content)));
        let sha = "";
        try {
          const r = await fetch(url + "?ref=" + branch, { headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github.v3+json" } });
          if (r.ok) { const d = await r.json(); sha = d.sha; }
        } catch (_) {}
        const body = { message: "update " + filePath, content: encoded, branch };
        if (sha) body.sha = sha;
        return fetch(url, { method: "PUT", headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }

      function getFolder(path) {
        const parts = path.split("/");
        return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      }

      try {
        await commitFile("admin/data/articles.json", JSON.stringify({ articles }, null, 2));
        await commitFile("admin/data/categories.json", JSON.stringify({ categories }, null, 2));
        await commitFile("admin/data/settings.json", JSON.stringify(settings, null, 2));
        const articlePromises = articles.map(async (a) => {
          const folder = "articles/" + a.slug;
          let html = generateArticleHTML(a);
          await commitFile(folder + "/index.html", html);
          if (a.imageData && a.imageData.startsWith("data:")) {
            const imgPath = a.image && getFolder(a.image) ? a.image : "articles/" + a.slug + "/img/default.png";
            const imgFolder = getFolder(imgPath);
            if (!a.image || a.image.indexOf("default.png") === -1) {
              await commitFile(imgPath, a.imageData);
            }
          }
        });
        await Promise.all(articlePromises);
        await commitFile("index.html", generateBlogHomepage());
        const categoryPromises = categories.map(async (c) => {
          await commitFile("category/" + c.slug + "/index.html", generateCategoryPage(c));
        });
        await Promise.all(categoryPromises);
        document.getElementById("lastSyncTime").textContent = "آخر مزامنة: " + new Date().toLocaleString("ar-SA");
        showToast("تم رفع جميع البيانات إلى GitHub", "success");
      } catch (err) {
        console.error("GitHub sync error:", err);
        showToast("خطأ في المزامنة: " + err.message, "error");
      }
    }
'@ -Encoding UTF8
