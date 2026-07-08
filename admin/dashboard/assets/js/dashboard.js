(function() {
  function $(id) { return document.getElementById(id); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  window.DashUtils = {
    formatDate: function(d) {
      if (!d) return '';
      if (d.includes && d.includes('T')) d = d.split('T')[0];
      return d;
    },

    showFlash: function(msg, type) {
      type = type || 'success';
      var toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.className = type + ' show';
      clearTimeout(toast._hide);
      toast._hide = setTimeout(function() { toast.classList.remove('show'); }, 3500);
    },

    showLoading: function(msg) {
      var overlay = document.getElementById('loadingOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div><p>' + (msg || 'جاري التحميل...') + '</p>';
        document.body.appendChild(overlay);
      }
      overlay.querySelector('p').textContent = msg || 'جاري التحميل...';
      overlay.classList.add('show');
    },

    hideLoading: function() {
      var overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.remove('show');
    },

    getUrlParams: function() {
      var params = {};
      var query = window.location.search.substring(1);
      if (!query) return params;
      query.split('&').forEach(function(pair) {
        var parts = pair.split('=');
        if (parts[0]) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      });
      return params;
    }
  };

  window.DashApp = {
    currentPage: window.location.pathname.split('/').pop(),

    init: function() {
      var self = this;
      var user = window.DashAuth ? window.DashAuth.currentUser : null;

      this._renderHeader(user);
      this._highlightNav();

      if (!localStorage.getItem('dash_categories')) {
        window.BlogAPI.getCategories().then(function(cats) {
          localStorage.setItem('dash_categories', JSON.stringify(cats));
        }).catch(function() {
          var fallback = [
            {id:'text-tools',name_ar:'أدوات النصوص والكلمات',name_en:'Text & Word Tools',desc_ar:'أدوات تحرير النصوص وتحليل الكلمات',color:'#6366F1',icon:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',order:1},
            {id:'Developer',name_ar:'أدوات المطورين',name_en:'Developer Tools',desc_ar:'أدوات البرمجة وتطوير الويب',color:'#10B981',icon:'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',order:2},
            {id:'Photo-Editing',name_ar:'أدوات الصور والتصميم',name_en:'Photo & Design Tools',desc_ar:'أدوات تحرير الصور والتصميم الجرافيكي',color:'#F59E0B',icon:'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',order:3},
            {id:'Calculators',name_ar:'أدوات الحاسبة',name_en:'Calculator Tools',desc_ar:'حاسبات رياضية ومالية تعليمية',color:'#3B82F6',icon:'<rect width="20" height="20" x="2" y="2" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/>',order:4},
            {id:'docs-tools',name_ar:'أدوات PDF والمستندات',name_en:'PDF & Document Tools',desc_ar:'أدوات تحرير ودمج وتحويل PDF',color:'#EC4899',icon:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',order:5},
            {id:'zip-tools',name_ar:'أدوات ZIP والضغط',name_en:'ZIP & Compression Tools',desc_ar:'أدوات ضغط وفك ضغط الملفات',color:'#059669',icon:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',order:6},
            {id:'seo',name_ar:'أدوات SEO',name_en:'SEO Tools',desc_ar:'أدوات تحسين محركات البحث',color:'#14B8A6',icon:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m9 8 5 3-5 3V8z"/>',order:7},
            {id:'General',name_ar:'أدوات متنوعة',name_en:'General Tools',desc_ar:'أدوات عامة متنوعة',color:'#F59E0B',icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',order:8},
            {id:'Social-media',name_ar:'أدوات سوشيال ميديا',name_en:'Social Media Tools',desc_ar:'أدوات إدارة حسابات السوشيال ميديا',color:'#8B5CF6',icon:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',order:9}
          ];
          localStorage.setItem('dash_categories', JSON.stringify(fallback));
        });
      }
      if (!localStorage.getItem('dash_ai_providers')) {
        window.BlogAPI.getAIProviders().then(function(data) {
          window.BlogAPI.saveAIProviders(data);
        }).catch(function() {
          window.BlogAPI.saveAIProviders(self._getDefaultAIProviders());
        });
      }

      var page = this.currentPage;
      if (page === 'index.html' || page === '' || page === 'dashboard') {
        this.renderDashboard();
      } else if (page === 'add-post.html') {
        this.renderAddPost();
      } else if (page === 'edit-post.html') {
        this.renderEditPost();
      } else if (page === 'categories.html') {
        this.renderCategories();
      } else if (page === 'settings.html') {
        this.renderSettings();
      }
    },

    _renderHeader: function(user) {
      var header = document.getElementById('dashHeader');
      if (!header) return;
      var initial = user && user.user_metadata && user.user_metadata.full_name
        ? user.user_metadata.full_name.charAt(0)
        : (user && user.email ? user.email.charAt(0).toUpperCase() : 'A');
      var name = user && user.user_metadata && user.user_metadata.full_name
        ? user.user_metadata.full_name
        : (user && user.email ? user.email : 'Admin');

      header.innerHTML =
        '<div class="dash-header-inner container">' +
        '<a href="index.html" class="dash-logo">' +
        '<div class="dash-logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>' +
        '<span class="dash-logo-text">ToolRar</span></a>' +
        '<nav class="dash-nav" id="dashNav">' +
        '<a href="index.html" data-page="index"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> لوحة التحكم</a>' +
        '<a href="add-post.html" data-page="add-post"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> إضافة مقال</a>' +
        '<a href="categories.html" data-page="categories"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg> التصنيفات</a>' +
        '<a href="settings.html" data-page="settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> الإعدادات</a>' +
        '</nav>' +
        '<div class="dash-actions">' +
        '<div class="user-badge"><div class="avatar">' + initial + '</div><span>' + name + '</span></div>' +
        '<button class="logout-btn" onclick="window.DashAuth && window.DashAuth.logout()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> تسجيل الخروج</button>' +
        '</div>' +
        '<button class="dash-mobile-toggle" onclick="document.getElementById(\'dashNav\').classList.toggle(\'open\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>' +
        '</div>';
    },

    _highlightNav: function() {
      var page = this.currentPage;
      var links = qsa('.dash-nav a');
      links.forEach(function(link) {
        var dataPage = link.getAttribute('data-page');
        if (!dataPage) return;
        if (page.indexOf(dataPage) !== -1) {
          link.classList.add('active');
        }
      });
    },

    renderDashboard: function() {
      var app = document.getElementById('dashApp');
      if (!app) return;
      var self = this;

      var cats = [];
      try { cats = JSON.parse(localStorage.getItem('dash_categories') || '[]'); } catch(e) {}
      var posts = window.BlogAPI.getPosts();

      var published = posts.filter(function(p) { return p.status === 'published'; }).length;
      var drafts = posts.filter(function(p) { return p.status === 'draft'; }).length;
      var recentPosts = posts.slice(0, 5);

      app.innerHTML =
        '<div class="page-head">' +
        '<div><h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> لوحة التحكم</h1>' +
        '<p class="subtitle">مرحباً بك في لوحة إدارة مدونة ToolRar</p></div>' +
        '<a href="add-post.html" class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14"/><path d="M5 12h14"/></svg> مقال جديد</a></div>' +
        '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-card-icon" style="background:rgba(99,102,241,.1)"><svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div><div class="stat-card-info"><div class="num">' + posts.length + '</div><div class="lbl">إجمالي المقالات</div></div></div>' +
        '<div class="stat-card"><div class="stat-card-icon" style="background:rgba(16,185,129,.1)"><svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div><div class="stat-card-info"><div class="num">' + published + '</div><div class="lbl">منشورة</div></div></div>' +
        '<div class="stat-card"><div class="stat-card-icon" style="background:rgba(245,158,11,.1)"><svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg></div><div class="stat-card-info"><div class="num">' + drafts + '</div><div class="lbl">مسودة</div></div></div>' +
        '<div class="stat-card"><div class="stat-card-icon" style="background:rgba(99,102,241,.1)"><svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div class="stat-card-info"><div class="num">' + cats.length + '</div><div class="lbl">التصنيفات</div></div></div>' +
        '</div>' +
        '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> أحدث المقالات</h3>' +
        '<a href="add-post.html" class="btn btn-sm btn-primary">إضافة</a></div>' +
        (posts.length === 0
          ? '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><h3>لا توجد مقالات بعد</h3><p>قم بإضافة أول مقالة الآن</p></div>'
          : '<div class="table-wrap"><table><thead><tr><th>العنوان</th><th>التصنيف</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>' +
            recentPosts.map(function(p) {
              var cat = cats.find(function(c) { return c.id === p.category_id; });
              return '<tr>' +
                '<td><div class="post-title">' + p.title + '</div><div class="post-meta">' + (p.author || '') + '</div></td>' +
                '<td>' + (cat ? '<span class="cat-badge" style="background:' + cat.color + '22;color:' + cat.color + '">' + cat.name_ar + '</span>' : p.category_id) + '</td>' +
                '<td><span class="status-dot ' + (p.status || 'draft') + '" style="margin-left:4px"></span>' + (p.status === 'published' ? 'منشور' : p.status === 'draft' ? 'مسودة' : p.status) + '</td>' +
                '<td style="color:#94a3b8;font-size:.78rem">' + (p.created_at || '') + '</td>' +
                '<td><div class="actions"><a href="edit-post.html?id=' + p.id + '" class="action-btn edit-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg> تعديل</a>' +
                '<button class="action-btn delete-btn" onclick="DashApp.deletePost(\'' + p.id + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> حذف</button></div></td>' +
                '</tr>';
            }).join('') +
            '</tbody></table></div>') +
        '</div>';
    },

    _getDefaultAIProviders: function() {
      if (window.AI_PROVIDERS_DATA) return window.AI_PROVIDERS_DATA;
      return {"providers":[
        {"id":"google","name":"Google AI Studio","name_ar":"Google AI Studio (قوقل AI ستوديو)","api_endpoint":"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent","api_key":"AQ.Ab8RN6KhduQtbtmII7u0ijcaZDzc7xb8iZCTnPETVnZ2F3nfog","default_model":"gemini-1.5-flash","models":[
          {"id":"gemini-2.5-flash","name":"gemini-2.5-flash (أحدث نموذج سريع - توليد نصوص وأكواد)"},{"id":"gemini-2.5-pro","name":"gemini-2.5-pro (ذكاء فائق ومنطق عالي - نصوص وأكواد معقدة)"},{"id":"gemini-2.0-flash","name":"gemini-2.0-flash (سريع جداً وذكي - نصوص وأكواد)"},{"id":"gemini-2.0-flash-thinking-exp","name":"gemini-2.0-flash-thinking-exp (استدلال وتفكير عميق)"},{"id":"gemini-1.5-flash","name":"gemini-1.5-flash (افتراضي متزن وسياق طويل - نصوص وأكواد)"},{"id":"gemini-1.5-pro","name":"gemini-1.5-pro (تحليل عميق وسياق ضخم - نصوص وأكواد)"}
        ],"extra_headers":{}},
        {"id":"opencode","name":"OpenCode Zen","name_ar":"OpenCode Zen (خطة زين)","api_endpoint":"https://opencode.ai/zen/v1/chat/completions","api_key":"sk-KQSYcYOXAr5YDBCzFh7jlVlxoSR5ZI4cnc8y56RlJJ9YjROqQhkmuG6fvKLwsWrR","default_model":"deepseek-v4-flash-free","models":[
          {"id":"qwen3.6-plus-free","name":"qwen3.6-plus-free (كوين 3.6 بلس مجاني - نصوص وبرمجة)"},{"id":"deepseek-v4-flash-free","name":"deepseek-v4-flash-free (ديب سيك v4 فلاش مجاني - سريع جداً)"},{"id":"minimax-m3-free","name":"minimax-m3-free (مينيمكس 3 مجاني - نصوص ومقالات وسياق كبير)"},{"id":"mimo-v2.5-free","name":"mimo-v2.5-free (ميمو 2.5 مجاني - برمجة وتوليد أكواد)"},{"id":"big-pickle","name":"big-pickle (بيج بيكل مجاني - برمجة وتوليد أكواد)"},{"id":"nemotron-3-ultra-free","name":"nemotron-3-ultra-free (نيموترون 3 الترا مجاني)"},{"id":"nemotron-3-super-free","name":"nemotron-3-super-free (نيموترون مجاني - نصوص ومقالات)"}
        ],"extra_headers":{}},
        {"id":"openrouter","name":"OpenRouter","name_ar":"OpenRouter (أوبن راوتر)","api_endpoint":"https://openrouter.ai/api/v1/chat/completions","api_key":"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","default_model":"deepseek/deepseek-v4-flash:free","models":[
          {"id":"deepseek/deepseek-v4-flash:free","name":"DeepSeek V4 Flash (free) - ديب سيك V4 فلاش مجاني"},{"id":"z-ai/glm-4.5-air:free","name":"GLM 4.5 Air (free) - جي إل إم 4.5 إير مجاني"},{"id":"moonshotai/kimi-k2.6:free","name":"Kimi K2.6 (free) - كيمي K2.6 مجاني"},{"id":"poolside/laguna-m.1:free","name":"Laguna M.1 (free) - لاجونا M.1 مجاني"},{"id":"poolside/laguna-xs.2:free","name":"Laguna XS.2 (free) - لاجونا XS.2 مجاني"},{"id":"openai/gpt-oss-120b:free","name":"gpt-oss-120b (free) - جي بي تي أوس 120b مجاني"}
        ],"extra_headers":{"HTTP-Referer":"https://toolrar.com","X-Title":"ToolRar"}},
        {"id":"groq","name":"Groq","name_ar":"Groq (منصة جروك)","api_endpoint":"https://api.groq.com/openai/v1/chat/completions","api_key":"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","default_model":"llama-3.3-70b-versatile","models":[
          {"id":"llama-3.3-70b-versatile","name":"llama-3.3-70b-versatile (نموذج ميتا القوي - نصوص ومقالات ومحادثة)"},{"id":"deepseek-r1-distill-llama-70b","name":"deepseek-r1-distill-llama-70b (تفكير واستدلال - برمجة وكود ونصوص معقدة)"},{"id":"deepseek-r1-distill-qwen-32b","name":"deepseek-r1-distill-qwen-32b (تفكير واستدلال ممتاز - برمجة وكود ونصوص)"},{"id":"qwen-2.5-coder-32b","name":"qwen-2.5-coder-32b (نموذج علي بابا المتخصص - برمجة وتوليد أكواد)"},{"id":"llama-3.1-8b-instant","name":"llama-3.1-8b-instant (نموذج ميتا السريع - نصوص ومحادثة خفيفة)"},{"id":"mixtral-8x7b-32768","name":"mixtral-8x7b-32768 (سياق طويل 32k - نصوص وبرمجة)"},{"id":"gemma2-9b-it","name":"gemma2-9b-it (نموذج قوقل خفيف - نصوص ومحادثة)"}
        ],"extra_headers":{}},
        {"id":"cerebras","name":"Cerebras","name_ar":"Cerebras (منصة سيريبراس السريعة)","api_endpoint":"https://api.cerebras.ai/v1/chat/completions","api_key":"csk-8hnwewjmfy46xthhwcn3t22n94tt9t349e2rdkw9xvnf28pc","default_model":"gpt-oss-120b","models":[
          {"id":"gpt-oss-120b","name":"gpt-oss-120b (استدلال وتفكير عميق فائق السرعة - نصوص وأكواد)"},{"id":"zai-glm-4.7","name":"zai-glm-4.7 (نموذج محادثة ذكي وفائق السرعة - نصوص وأكواد)"}
        ],"extra_headers":{}},
        {"id":"siliconflow","name":"SiliconFlow","name_ar":"SiliconFlow (سيليكون فلو - GLM)","api_endpoint":"https://api.siliconflow.com/v1/chat/completions","api_key":"sk-uksfscrxjhaynjmlcpbhcvykqqkukmjwqdidjbvsczsjdsge","default_model":"deepseek-ai/DeepSeek-V4-Flash","models":[
          {"id":"deepseek-ai/DeepSeek-R1","name":"DeepSeek-R1 (برمجة/تفكير - الأقوى)"},{"id":"deepseek-ai/DeepSeek-V4-Pro","name":"DeepSeek-V4-Pro (برمجة)"},{"id":"deepseek-ai/DeepSeek-V4-Flash","name":"DeepSeek-V4-Flash (برمجة/سريع)"},{"id":"zai-org/GLM-5.1","name":"GLM-5.1 (برمجة - GLM)"},{"id":"deepseek-ai/DeepSeek-V3.2","name":"DeepSeek-V3.2 (برمجة/نصوص)"},{"id":"zai-org/GLM-5","name":"GLM-5 (برمجة - GLM)"},{"id":"deepseek-ai/DeepSeek-V3.1","name":"DeepSeek-V3.1 (برمجة/نصوص)"},{"id":"Qwen/Qwen3-Coder-30B-A3B-Instruct","name":"Qwen3-Coder-30B (برمجة)"},{"id":"Qwen/Qwen3-32B","name":"Qwen3-32B (نصوص/برمجة)"},{"id":"zai-org/GLM-4.5-Air","name":"GLM-4.5-Air (نصوص - GLM)"},{"id":"zai-org/GLM-5V-Turbo","name":"GLM-5V-Turbo (نصوص - GLM)"},{"id":"google/gemma-4-31B-it","name":"Gemma-4-31B (نصوص)"},{"id":"MiniMaxAI/MiniMax-M3","name":"MiniMax-M3 (نصوص)"},{"id":"moonshotai/Kimi-K2.6","name":"Kimi-K2.6 (نصوص)"},{"id":"openai/gpt-oss-120b","name":"GPT-OSS-120B (نصوص)"},{"id":"stepfun-ai/Step-3.5-Flash","name":"Step-3.5-Flash (نصوص)"},{"id":"Qwen/Qwen3-14B","name":"Qwen3-14B (نصوص)"},{"id":"Qwen/Qwen3-8B","name":"Qwen3-8B (نصوص)"},{"id":"Qwen/Qwen2.5-72B-Instruct","name":"Qwen2.5-72B (نصوص)"},{"id":"Qwen/Qwen2.5-7B-Instruct","name":"Qwen2.5-7B (نصوص)"}
        ],"extra_headers":{}},
        {"id":"routeway","name":"Routeway","name_ar":"Routeway (منصة راوت واي)","api_endpoint":"https://api.routeway.ai/v1/chat/completions","api_key":"sk-Mrl1csStecbVXviGdJaae157NT5Whg9WVY6ZMqy8wg05AcmJhokX0l9e5SHQjjltcsTlaLhwN8H8HDf1-w5O","default_model":"deepseek-v4-flash:free","models":[
          {"id":"deepseek-v4-flash:free","name":"DeepSeek V4 Flash (برمجة/سريع)"},{"id":"llama-3.3-70b-instruct:free","name":"Llama 3.3 70B (نصوص/برمجة)"},{"id":"nemotron-3-nano-30b-a3b:free","name":"Nemotron 3 Nano 30B (نصوص)"},{"id":"llama-3.1-8b-instruct:free","name":"Llama 3.1 8B (نصوص)"},{"id":"llama-3.2-3b-instruct:free","name":"Llama 3.2 3B (نصوص)"},{"id":"llama-3.2-1b-instruct:free","name":"Llama 3.2 1B (نصوص)"},{"id":"mistral-nemo-instruct:free","name":"Mistral Nemo (نصوص)"},{"id":"nemotron-nano-9b-v2:free","name":"Nemotron Nano 9B (نصوص)"},{"id":"minimax-m2:free","name":"MiniMax M2 (نصوص)"},{"id":"gpt-oss-120b:free","name":"GPT-OSS 120B (نصوص)"},{"id":"step-3.5-flash:free","name":"Step 3.5 Flash (نصوص)"},{"id":"ling-2.6-flash:free","name":"Ling 2.6 Flash (نصوص)"},{"id":"laguna-xs.2:free","name":"Laguna XS.2 (نصوص)"},{"id":"laguna-m.1:free","name":"Laguna M.1 (نصوص)"}
        ],"extra_headers":{}},
        {"id":"featherless","name":"Featherless","name_ar":"Featherless (مخدم GLM)","api_endpoint":"https://api.featherless.ai/v1/chat/completions","api_key":"rc_ad3f761e6bcecf4c751c248e549bc2a045438e268d4c995172d338155615db0d","default_model":"zai-org/GLM-5.1","models":[
          {"id":"zai-org/GLM-5.1","name":"GLM-5.1 (برمجة - GLM الأحدث)"},{"id":"zai-org/GLM-5","name":"GLM-5 (برمجة - GLM)"},{"id":"zai-org/GLM-4.7","name":"GLM-4.7 (نصوص/برمجة - GLM)"},{"id":"zai-org/GLM-4.6","name":"GLM-4.6 (نصوص/برمجة - GLM)"}
        ],"extra_headers":{}},
        {"id":"agentrouter","name":"AgentRouter","name_ar":"AgentRouter (agentrouter.org)","api_endpoint":"https://agentrouter.org/v1/chat/completions","api_key":"sk-Ry7ht1FvHQ7NE4OjN9Cc9wKqZBSVP8Jwm9MwH1VyK4OeLuEl","default_model":"glm-5.2","models":[
          {"id":"glm-5.2","name":"GLM 5.2"},
          {"id":"claude-opus-4-6","name":"Claude Opus 4.6"},
          {"id":"gpt-5.5","name":"GPT-5.5"},
          {"id":"claude-opus-4-8","name":"Claude Opus 4.8"}
        ],"extra_headers":{}},
        {"id":"github","name":"GitHub Models","name_ar":"GitHub Models (نماذج GPT)","api_endpoint":"https://models.github.ai/inference/chat/completions","api_key":"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","default_model":"openai/gpt-4.1","models":[
          {"id":"openai/gpt-4.1","name":"GPT-4.1 (برمجة - الأقوى)"},{"id":"deepseek/deepseek-r1","name":"DeepSeek R1 (برمجة/تفكير)"},{"id":"deepseek/deepseek-r1-0528","name":"DeepSeek R1-0528 (برمجة/تفكير)"},{"id":"openai/gpt-4o","name":"GPT-4o (برمجة/نصوص)"},{"id":"deepseek/deepseek-v3-0324","name":"DeepSeek V3-0324 (برمجة)"},{"id":"mistral-ai/codestral-2501","name":"Codestral 2501 (برمجة - كود)"},{"id":"meta/meta-llama-3.1-405b-instruct","name":"Llama 3.1 405B (برمجة/نصوص)"},{"id":"meta/llama-4-maverick-17b-128e-instruct-fp8","name":"Llama 4 Maverick 17B (نصوص)"},{"id":"meta/llama-3.3-70b-instruct","name":"Llama 3.3 70B (نصوص)"},{"id":"microsoft/phi-4-reasoning","name":"Phi-4 Reasoning (برمجة/تفكير)"},{"id":"microsoft/phi-4-mini-reasoning","name":"Phi-4 Mini Reasoning (برمجة/تفكير)"},{"id":"mistral-ai/mistral-medium-2505","name":"Mistral Medium 2505 (نصوص)"},{"id":"microsoft/phi-4","name":"Phi-4 (نصوص/برمجة)"},{"id":"mistral-ai/mistral-small-2503","name":"Mistral Small 2503 (نصوص)"},{"id":"meta/llama-4-scout-17b-16e-instruct","name":"Llama 4 Scout 17B (نصوص)"},{"id":"openai/gpt-4.1-mini","name":"GPT-4.1 Mini (نصوص/سريع)"},{"id":"openai/gpt-4.1-nano","name":"GPT-4.1 Nano (نصوص/سريع)"},{"id":"openai/gpt-4o-mini","name":"GPT-4o Mini (نصوص/سريع)"},{"id":"meta/meta-llama-3.1-8b-instruct","name":"Llama 3.1 8B (نصوص)"},{"id":"mistral-ai/ministral-3b","name":"Ministral 3B (نصوص)"},{"id":"cohere/cohere-command-a","name":"Cohere Command A (نصوص)"}
        ],"extra_headers":{"Accept":"application/vnd.github+json"}}
      ],"selected_provider":"openrouter","selected_model":"deepseek/deepseek-v4-flash:free","selected_lang":"ar"};
    },

    _ensureAIProviders: function(callback) {
      var self = this;
      var data = window.BlogAPI.getAIProviders();
      if (data && data.then) {
        data.then(function(d) {
          window.BlogAPI.saveAIProviders(d);
          if (callback) callback();
        }).catch(function() {
          window.BlogAPI.saveAIProviders(self._getDefaultAIProviders());
          if (callback) callback();
        });
        return true;
      }
      return false;
    },

    renderAddPost: function() {
      var app = document.getElementById('dashApp');
      if (!app) return;
      var self = this;
      var pending = this._ensureAIProviders(function() {
        self._renderPostForm(app, null);
      });
      if (pending) {
        app.innerHTML = '<div class="page-head"><h1>جاري التحميل...</h1></div>';
      } else {
        this._renderPostForm(app, null);
      }
    },

    renderEditPost: function() {
      var app = document.getElementById('dashApp');
      if (!app) return;
      var params = DashUtils.getUrlParams();
      var postId = params.id;
      if (!postId) {
        app.innerHTML = '<div class="empty-state"><h3>لم يتم تحديد المقال</h3><p>الرجاء العودة إلى لوحة التحكم</p><a href="index.html" class="btn btn-primary" style="margin-top:16px">العودة</a></div>';
        return;
      }
      var post = window.BlogAPI.getPostById(postId);
      if (!post) {
        app.innerHTML = '<div class="empty-state"><h3>المقال غير موجود</h3><p>قد يكون قد تم حذفه</p><a href="index.html" class="btn btn-primary" style="margin-top:16px">العودة</a></div>';
        return;
      }
      var self = this;
      var pending = this._ensureAIProviders(function() {
        self._renderPostForm(app, post);
      });
      if (pending) {
        app.innerHTML = '<div class="page-head"><h1>جاري التحميل...</h1></div>';
      } else {
        this._renderPostForm(app, post);
      }
    },

    _renderPostForm: function(app, post) {
      var self = this;
      var isEdit = !!post;
      var cats = [];
      try { cats = JSON.parse(localStorage.getItem('dash_categories') || '[]'); } catch(e) {}
      if (cats.length === 0) {
        cats = [
          {id:'text-tools',name_ar:'أدوات النصوص والكلمات',color:'#6366F1',icon:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'},
          {id:'Developer',name_ar:'أدوات المطورين',color:'#10B981',icon:'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'},
          {id:'Photo-Editing',name_ar:'أدوات الصور والتصميم',color:'#F59E0B',icon:'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'},
          {id:'Calculators',name_ar:'أدوات الحاسبة',color:'#3B82F6',icon:'<rect width="20" height="20" x="2" y="2" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/>'},
          {id:'docs-tools',name_ar:'أدوات PDF والمستندات',color:'#EC4899',icon:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'},
          {id:'zip-tools',name_ar:'أدوات ZIP والضغط',color:'#059669',icon:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>'},
          {id:'seo',name_ar:'أدوات SEO',color:'#14B8A6',icon:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m9 8 5 3-5 3V8z"/>'},
          {id:'General',name_ar:'أدوات متنوعة',color:'#F59E0B',icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'},
          {id:'Social-media',name_ar:'أدوات سوشيال ميديا',color:'#8B5CF6',icon:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'}
        ];
      }

      var aiData = window.BlogAPI.getAIProviders();
      if (aiData && aiData.then) { aiData = null; }
      var providersList = (aiData && aiData.providers) ? aiData.providers : [];
      if (providersList.length === 0) {
        providersList = (window.AI_PROVIDERS_DATA && window.AI_PROVIDERS_DATA.providers) ? window.AI_PROVIDERS_DATA.providers : [];
      }
      if (providersList.length === 0) {
        var def = this._getDefaultAIProviders();
        providersList = def && def.providers ? def.providers : [];
      }
      var selectedProvider = (aiData && aiData.selected_provider) || 'openrouter';
      var selectedModel = (aiData && aiData.selected_model) || '';
      var selectedLang = (aiData && aiData.selected_lang) || 'ar';

      var providerOptions = providersList.map(function(p) {
        return '<option value="' + p.id + '" ' + (p.id === selectedProvider ? 'selected' : '') + '>' + self._escHtml(p.name_ar || p.name) + '</option>';
      }).join('');

      var currentProvider = providersList.find(function(p) { return p.id === selectedProvider; });
      var models = currentProvider ? currentProvider.models : [];
      var modelOptions = models.map(function(m) {
        return '<option value="' + m.id + '" ' + (m.id === selectedModel ? 'selected' : '') + '>' + self._escHtml(m.name) + '</option>';
      }).join('');

      var catOptions = cats.map(function(c) {
        return '<option value="' + c.id + '" ' + ((post && post.category_id === c.id) ? 'selected' : '') + '>' + c.name_ar + '</option>';
      }).join('');

      app.innerHTML =
        '<div class="page-head">' +
        '<h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        (isEdit ? '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>' : '<path d="M12 5v14"/><path d="M5 12h14"/>') +
        '</svg> ' + (isEdit ? 'تعديل المقال' : 'إضافة مقال جديد') + '</h1>' +
        '<a href="index.html" class="btn btn-outline btn-sm">← العودة</a>' +
        '</div>' +
        '<div class="card">' +
        '<form id="postForm" onsubmit="return false;">' +
        '<div class="form-group"><label class="required">عنوان المقال <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'title\')" title="توليد عنوان بالذكاء الاصطناعي">🤖</button></label><input class="form-control" id="postTitle" value="' + (post ? self._escHtml(post.title) : '') + '" placeholder="أدخل عنوان المقال" required></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label class="required">التصنيف</label><select class="form-control" id="postCategory">' + catOptions + '</select></div>' +
        '<div class="form-group"><label>المؤلف</label><input class="form-control" id="postAuthor" value="' + (post ? self._escHtml(post.author || '') : '') + '" placeholder="اسم الكاتب"></div>' +
        '</div>' +
        '<div class="form-row-3">' +
        '<div class="form-group"><label>الرابط المختصر (Slug)</label><input class="form-control" id="postSlug" value="' + (post ? self._escHtml(post.slug || '') : '') + '" placeholder="auto-generate" dir="ltr" style="text-align:left"><div class="hint">اتركه فارغاً للتوليد التلقائي من العنوان</div></div>' +
        '<div class="form-group"><label>وقت القراءة (دقائق)</label><input class="form-control" id="postReadTime" type="number" value="' + (post ? (post.read_time || '5') : '5') + '" min="1"></div>' +
        '<div class="form-group"><label>الحالة</label><select class="form-control" id="postStatus"><option value="published" ' + ((!post || post.status === 'published') ? 'selected' : '') + '>منشور</option><option value="draft" ' + ((post && post.status === 'draft') ? 'selected' : '') + '>مسودة</option></select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Created time</label><input class="form-control" id="postCreatedAt" type="datetime-local" value="' + self._escHtml((post && post.created_at) ? self._toDateTimeInput(post.created_at) : window.BlogAPI.toLocalDateTimeValue(new Date())) + '"><div class="hint">Used automatically for schema datePublished.</div></div>' +
        '<div class="form-group"><label>Updated time</label><input class="form-control" id="postUpdatedAt" type="datetime-local" value="' + self._escHtml((post && post.updated_at) ? self._toDateTimeInput(post.updated_at) : window.BlogAPI.toLocalDateTimeValue(new Date())) + '"><div class="hint">Used automatically for schema dateModified.</div></div>' +
        '</div>' +
        '<div class="form-group"><label>الوصف المختصر <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'excerpt\')" title="توليد وصف بالذكاء الاصطناعي">🤖</button></label><textarea class="form-control" id="postExcerpt" rows="2" placeholder="وصف مختصر للمقال">' + (post ? self._escHtml(post.excerpt || '') : '') + '</textarea></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Meta Description (SEO) <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'meta\')" title="توليد وصف SEO بالذكاء الاصطناعي">🤖</button></label><textarea class="form-control" id="postMetaDesc" rows="2" placeholder="وصف متخصص لمحركات البحث" maxlength="160">' + (post ? self._escHtml(post.meta_desc || '') : '') + '</textarea><div class="hint" id="metaCount">0 / 160</div></div>' +
        '<div class="form-group"><label>الكلمات المفتاحية <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'keywords\')" title="توليد كلمات مفتاحية بالذكاء الاصطناعي">🤖</button></label><input class="form-control" id="postKeywords" value="' + (post ? self._escHtml(post.keywords || '') : '') + '" placeholder="SEO, مدونة, أدوات"></div>' +
        '</div>' +
        '<hr class="form-divider">' +
        '<div class="form-group"><label>صورة المقال المميزة</label>' +
        '<div class="image-upload-wrap" id="imageUploadWrap">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' +
        '<p>اسحب الصورة هنا أو انقر للاختيار</p><span class="hint">يفضل JPG, PNG, WEBP - أبعاد 1200x630</span>' +
        '<input type="file" id="postImageInput" accept="image/*">' +
        '</div>' +
        '<div class="image-preview' + ((post && post.image) ? ' show' : '') + '" id="imagePreview">' +
        '<img id="imagePreviewImg" src="' + ((post && post.image) ? '../../blog2/' + post.category_id + '/img/' + post.image : '') + '" alt="Preview">' +
        '<button class="remove-img" id="removeImageBtn" type="button">&times;</button>' +
        '</div>' +
        '<input type="hidden" id="postImage" value="' + (post ? self._escHtml(post.image || '') : '') + '">' +
        '<div class="form-row image-meta-fields">' +
        '<div class="form-group"><label>Saved image filename <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'image_name\')" title="توليد اسم ملف الصورة بالذكاء الاصطناعي">🤖</button></label><input class="form-control" id="postImageName" value="' + (post ? self._escHtml(post.image || '') : '') + '" placeholder="post-image.webp" dir="ltr" style="text-align:left"><div class="hint">This name is used when saving the image in the category img folder.</div></div>' +
        '<div class="form-group"><label>Image SEO alt text <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'image_alt\')" title="توليد نص الصورة البديل بالذكاء الاصطناعي">🤖</button></label><input class="form-control" id="postImageAlt" value="' + (post ? self._escHtml(post.image_alt || post.title || '') : '') + '" placeholder="Describe the image accurately"></div>' +
        '</div>' +
        '</div>' +
        '<hr class="form-divider">' +
        '<div class="form-group"><label class="required">محتوى المقال <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'content\')" title="توليد محتوى بالذكاء الاصطناعي">🤖</button></label>' +
        '<div class="form-group" style="margin-bottom:10px"><label>مربع الأوامر المخصص للنموذج (Custom Prompt) <button type="button" class="ai-btn" onclick="DashApp._aiGenerateField(\'content_custom\')" title="توليد المحتوى بناءً على الأوامر المخصصة">🧠</button></label><textarea class="form-control" id="postContentPrompt" rows="3" placeholder="اكتب هنا أي تعليمات إضافية للنموذج: مثل عدد الكلمات، شكل النص، الأسلوب، الأقسام المطلوبة... سيتم دمجها مع عنوان المقال"></textarea><div class="hint">اتركه فارغاً للتوليد التلقائي من العنوان فقط. عند الكتابة هنا سيلتزم النموذج بتعليماتك.</div></div>' +
        '<div class="professional-editor" id="professionalEditor">' +
        '<div class="preview-toggle editor-tabs"><button type="button" class="active" id="editTab" onclick="DashApp._toggleEditor(\'edit\')">المحرر المرئي</button><button type="button" id="htmlTab" onclick="DashApp._toggleEditor(\'html\')">HTML</button><button type="button" id="previewTab" onclick="DashApp._toggleEditor(\'preview\')">معاينة</button></div>' +
        '<div class="editor-toolbar" id="editorToolbar">' +
        '<select class="editor-format" onchange="DashApp._formatEditor(\'formatBlock\', this.value); this.selectedIndex = 0" title="تنسيق الفقرة"><option value="">فقرة</option><option value="h2">عنوان H2</option><option value="h3">عنوان H3</option><option value="p">نص عادي</option><option value="blockquote">اقتباس</option></select>' +
        '<span class="sep"></span>' +
        '<button type="button" onclick="DashApp._formatEditor(\'bold\')" title="عريض"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'italic\')" title="مائل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'underline\')" title="تسطير"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></button>' +
        '<span class="sep"></span>' +
        '<button type="button" onclick="DashApp._formatEditor(\'justifyRight\')" title="محاذاة يمين"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="7" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'justifyCenter\')" title="توسيط"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="18" y1="18" x2="6" y2="18"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'justifyLeft\')" title="محاذاة يسار"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="17" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>' +
        '<span class="sep"></span>' +
        '<button type="button" onclick="DashApp._formatEditor(\'insertUnorderedList\')" title="قائمة نقطية"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'insertOrderedList\')" title="قائمة مرقمة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'outdent\')" title="تقليل المسافة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg></button>' +
        '<button type="button" onclick="DashApp._formatEditor(\'indent\')" title="زيادة المسافة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg></button>' +
        '<span class="sep"></span>' +
        '<button type="button" onclick="DashApp._insertEditorLink()" title="إضافة رابط"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>' +
        '<button type="button" onclick="DashApp._insertEditorImage()" title="إضافة صورة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></button>' +
        '<button type="button" onclick="DashApp._insertEditorTable()" title="إضافة جدول"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg></button>' +
        '<span class="sep"></span>' +
        '<button type="button" onclick="DashApp._formatEditor(\'removeFormat\')" title="مسح التنسيق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><path d="m19 15-4 4"/><path d="m15 15 4 4"/></svg></button>' +
        '</div>' +
        '<div class="editor-area"><div class="rich-editor" id="richPostContent" contenteditable="true" data-placeholder="اكتب محتوى المقال هنا..."></div><textarea class="form-control html-editor" id="postContent" placeholder="اكتب محتوى المقال هنا... (HTML)">' + (post ? self._escHtml(post.content || '') : '') + '</textarea></div>' +
        '<div class="editor-status"><span id="editorWordCount">0 كلمة</span><span>يتم حفظ المحتوى بصيغة HTML</span></div>' +
        '<div class="preview-content" id="previewContent"></div>' +
        '</div>' +
        '<hr class="form-divider">' +
        '<div class="form-group"><label>معاينة SEO</label>' +
        '<div class="seo-preview">' +
        '<div class="seo-url" id="seoUrl">' + window.BlogAPI.getSettings().site_url + '/blog2/...</div>' +
        '<div class="seo-title" id="seoTitle">' + (post ? self._escHtml(post.title) : 'عنوان المقال') + ' - ' + window.BlogAPI.getSettings().blog_title + '</div>' +
        '<div class="seo-desc" id="seoDesc">' + (post ? self._escHtml(post.meta_desc || post.excerpt || '') : 'وصف المقال الذي سيظهر في نتائج البحث') + '</div>' +
        '</div></div>' +
        '<hr class="form-divider">' +
        '<div id="aiSettingsSection" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:20px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<h3 style="font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:6px">⚙️ إعدادات الذكاء الاصطناعي</h3>' +
        '<button type="button" class="btn btn-sm btn-outline" onclick="window.location.href=\'settings.html\'">إدارة المزودين</button>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>مزود الخدمة</label><select class="form-control" id="aiProvider" onchange="DashApp._onAIProviderChange()">' + providerOptions + '</select></div>' +
        '<div class="form-group"><label>النموذج</label><select class="form-control" id="aiModel">' + modelOptions + '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>اللغة</label><select class="form-control" id="aiLang"><option value="ar">العربية</option><option value="en">English</option><option value="fr">Français</option></select></div>' +
        '<div class="form-group"><label>نوع التوليد</label><select class="form-control" id="aiGenType" onchange="DashApp._toggleCustomPrompt()"><option value="short_desc">وصف قصير</option><option value="meta_desc">وصف SEO</option><option value="long_desc">وصف طويل (مقال)</option><option value="faq">أسئلة شائعة</option><option value="keywords">كلمات مفتاحية</option><option value="generate_code">توليد كود (HTML/CSS/JS)</option></select></div>' +
        '</div>' +
        '<div id="customPromptWrap" style="display:none;margin-bottom:10px">' +
        '<div class="form-group"><label>وصف الكود المطلوب</label>' +
        '<textarea class="form-control" id="aiCodePrompt" rows="2" placeholder="اكتب وصفاً للأداة التي تريدها... مثال: أداة لحساب عمر الإنسان بالسنوات والشهور والأيام"></textarea></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="DashApp._aiGenerateAll()">🧠 توليد المحتوى كاملاً</button>' +
        '<span style="font-size:.72rem;color:#94a3b8;display:flex;align-items:center">سيتم استخدام المزود والمفتاح من الإعدادات</span>' +
        '</div>' +
        '</div>' +
        '<div class="form-actions">' +
        '<button type="submit" class="btn btn-success btn-lg" id="savePostBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ' + (isEdit ? 'حفظ التعديلات' : 'نشر المقال') + '</button>' +
        '<button type="button" class="btn btn-outline" onclick="window.location.href=\'index.html\'">إلغاء</button>' +
        '</div>' +
        '</form>' +
        '</div>';

      this._initPostForm(post);
    },

    _initPostForm: function(post) {
      var self = this;
      var isEdit = !!post;

      var titleInput = document.getElementById('postTitle');
      var slugInput = document.getElementById('postSlug');
      var metaDesc = document.getElementById('postMetaDesc');
      var metaCount = document.getElementById('metaCount');
      var contentArea = document.getElementById('postContent');
      var seoUrl = document.getElementById('seoUrl');
      var seoTitle = document.getElementById('seoTitle');
      var seoDesc = document.getElementById('seoDesc');
      var imageInput = document.getElementById('postImageInput');
      var imagePreview = document.getElementById('imagePreview');
      var imagePreviewImg = document.getElementById('imagePreviewImg');
      var postImage = document.getElementById('postImage');
      var postImageName = document.getElementById('postImageName');
      var postImageAlt = document.getElementById('postImageAlt');
      var removeImgBtn = document.getElementById('removeImageBtn');

      var settings = window.BlogAPI.getSettings();

      function updateSEO() {
        var title = titleInput.value || 'عنوان المقال';
        var slug = slugInput.value || window.BlogAPI.generateSlug(titleInput.value || '');
        var cat = document.getElementById('postCategory');
        var catId = cat ? cat.value : 'text-tools';
        seoUrl.textContent = settings.site_url + '/blog2/' + catId + '/' + slug + '.html';
        seoTitle.textContent = title + ' - ' + settings.blog_title;
        seoDesc.textContent = metaDesc.value || excerptEl.value || 'وصف المقال الذي سيظهر في نتائج البحث';
      }

      var excerptEl = document.getElementById('postExcerpt');

      titleInput.addEventListener('input', function() {
        if (!slugInput.value || slugInput.dataset.auto !== 'false') {
          slugInput.value = window.BlogAPI.generateSlug(titleInput.value);
          slugInput.dataset.auto = 'false';
        }
        updateSEO();
      });

      slugInput.addEventListener('input', updateSEO);
      if (metaDesc) {
        metaDesc.addEventListener('input', function() {
          metaCount.textContent = this.value.length + ' / 160';
          updateSEO();
        });
      }
      if (excerptEl) excerptEl.addEventListener('input', updateSEO);
      var catSelect = document.getElementById('postCategory');
      if (catSelect) catSelect.addEventListener('change', updateSEO);

      imageInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          imagePreviewImg.src = ev.target.result;
          imagePreview.classList.add('show');
          postImage.value = self._safeImageName(file.name, slugInput.value || titleInput.value || 'post-image');
          if (postImageName) postImageName.value = postImage.value;
          if (postImageAlt && !postImageAlt.value) postImageAlt.value = titleInput.value;
          self._pendingPostImage = {
            fileName: postImage.value,
            content: String(ev.target.result).split(',')[1] || '',
            mime: file.type || 'image/jpeg'
          };
        };
        reader.readAsDataURL(file);
      });

      removeImgBtn.addEventListener('click', function() {
        imagePreview.classList.remove('show');
        imagePreviewImg.src = '';
        postImage.value = '';
        if (postImageName) postImageName.value = '';
        if (postImageAlt) postImageAlt.value = '';
        imageInput.value = '';
        self._pendingPostImage = null;
      });

      document.getElementById('postForm').addEventListener('submit', function(e) {
        e.preventDefault();
        self._savePost(post);
      });

      ['aiProvider', 'aiModel', 'aiLang'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', function() {
            self._saveAISelection();
          });
        }
      });
      this._initRichEditor();
    },

    _initRichEditor: function() {
      var self = this;
      var rich = document.getElementById('richPostContent');
      var textarea = document.getElementById('postContent');
      if (!rich || !textarea) return;

      rich.innerHTML = textarea.value || '';
      var syncToTextarea = function() {
        textarea.value = rich.innerHTML.trim();
        self._updateEditorStats();
      };
      var syncToRich = function() {
        if (document.activeElement !== rich) {
          rich.innerHTML = textarea.value || '';
        }
        self._updateEditorStats();
      };

      rich.addEventListener('input', syncToTextarea);
      rich.addEventListener('blur', syncToTextarea);
      textarea.addEventListener('input', syncToRich);
      this._updateEditorStats();
    },

    _syncRichEditorFromTextarea: function() {
      var rich = document.getElementById('richPostContent');
      var textarea = document.getElementById('postContent');
      if (!rich || !textarea) return;
      rich.innerHTML = textarea.value || '';
      this._updateEditorStats();
    },

    _syncTextareaFromRichEditor: function() {
      var rich = document.getElementById('richPostContent');
      var textarea = document.getElementById('postContent');
      if (!rich || !textarea) return;
      textarea.value = rich.innerHTML.trim();
      this._updateEditorStats();
    },

    _updateEditorStats: function() {
      var counter = document.getElementById('editorWordCount');
      var rich = document.getElementById('richPostContent');
      var textarea = document.getElementById('postContent');
      if (!counter) return;
      var source = rich && rich.offsetParent !== null ? rich.textContent : (textarea ? textarea.value.replace(/<[^>]*>/g, ' ') : '');
      var words = source.trim().split(/\s+/).filter(Boolean).length;
      counter.textContent = words + ' كلمة';
    },

    _savePost: function(existingPost) {
      this._syncTextareaFromRichEditor();
      var isEdit = !!existingPost;
      var title = document.getElementById('postTitle').value.trim();
      if (!title) { DashUtils.showFlash('يرجى إدخال عنوان المقال', 'error'); return; }

      var catSelect = document.getElementById('postCategory');
      var slug = document.getElementById('postSlug').value || window.BlogAPI.generateSlug(title);
      var categoryId = catSelect ? catSelect.value : 'text-tools';
      var imageAsset = null;
      var requestedImageName = (document.getElementById('postImageName') || {}).value || (document.getElementById('postImage') || {}).value || '';
      if (this._pendingPostImage && this._pendingPostImage.content) {
        this._pendingPostImage.fileName = this._safeImageName(requestedImageName || this._pendingPostImage.fileName, slug);
        document.getElementById('postImage').value = this._pendingPostImage.fileName;
        if (document.getElementById('postImageName')) document.getElementById('postImageName').value = this._pendingPostImage.fileName;
        imageAsset = {
          path: 'blog2/' + categoryId + '/img/' + this._pendingPostImage.fileName,
          content: this._pendingPostImage.content
        };
      } else if (requestedImageName) {
        document.getElementById('postImage').value = this._safeImageName(requestedImageName, slug);
      }
      var postData = {
        title: title,
        category_id: categoryId,
        author: (document.getElementById('postAuthor') || {}).value || 'Toolrar',
        slug: slug,
        excerpt: (document.getElementById('postExcerpt') || {}).value || '',
        meta_desc: (document.getElementById('postMetaDesc') || {}).value || '',
        keywords: (document.getElementById('postKeywords') || {}).value || '',
        content: document.getElementById('postContent').value,
        image: (document.getElementById('postImage') || {}).value || '',
        image_alt: (document.getElementById('postImageAlt') || {}).value || title,
        read_time: parseInt((document.getElementById('postReadTime') || {}).value) || 5,
        status: (document.getElementById('postStatus') || {}).value || 'published',
        created_at: (document.getElementById('postCreatedAt') || {}).value || '',
        updated_at: (document.getElementById('postUpdatedAt') || {}).value || ''
      };

      var savedPost;
      if (isEdit) {
        savedPost = window.BlogAPI.updatePost(existingPost.id, postData, imageAsset);
        if (savedPost) {
          DashUtils.showFlash('تم حفظ التعديلات بنجاح', 'success');
        }
      } else {
        savedPost = window.BlogAPI.addPost(postData, imageAsset);
        if (savedPost) {
          DashUtils.showFlash('تم نشر المقال بنجاح', 'success');
          document.getElementById('postForm').reset();
        }
      }

      if (savedPost) {
        this._pendingPostImage = null;
        setTimeout(function() {
          if (!isEdit) {
            window.location.href = 'index.html';
          }
        }, 1200);
      }
    },

    _onAIProviderChange: function() {
      var providerSelect = document.getElementById('aiProvider');
      var modelSelect = document.getElementById('aiModel');
      if (!providerSelect || !modelSelect) return;
      var providerId = providerSelect.value;
      var models = window.BlogAPI.getModelsForProvider(providerId);
      var provider = window.BlogAPI.getProviderById(providerId);
      var selectedModel = provider && provider.default_model ? provider.default_model : (models[0] ? models[0].id : '');
      modelSelect.innerHTML = models.map(function(m) {
        return '<option value="' + m.id + '" ' + (m.id === selectedModel ? 'selected' : '') + '>' + m.name + '</option>';
      }).join('');
      this._saveAISelection();
    },

    _saveAISelection: function() {
      var providerSelect = document.getElementById('aiProvider');
      var modelSelect = document.getElementById('aiModel');
      var langSelect = document.getElementById('aiLang');
      if (!providerSelect) return;
      var aiData = window.BlogAPI.getAIProviders();
      if (!aiData || !aiData.providers) return;
      aiData.selected_provider = providerSelect.value;
      aiData.selected_model = modelSelect ? modelSelect.value : '';
      aiData.selected_lang = langSelect ? langSelect.value : (aiData.selected_lang || 'ar');
      window.BlogAPI.saveAIProviders(aiData);
    },

    _setGeneratedValue: function(el, value) {
      if (!el) return;
      var finalValue = value == null ? '' : String(value);
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
        || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (setter && setter.set) {
        setter.set.call(el, finalValue);
      } else {
        el.value = finalValue;
      }
      if ('textContent' in el && el.tagName && el.tagName.toLowerCase() === 'textarea') {
        el.textContent = finalValue;
      }
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      if (el.id === 'postContent') {
        this._syncRichEditorFromTextarea();
      }
      if (typeof el.focus === 'function' && document.activeElement !== el) {
        el.focus();
      }
    },

    _aiGenerateField: function(field) {
      var self = this;
      var title = document.getElementById('postTitle');
      var excerpt = document.getElementById('postExcerpt');
      var metaDesc = document.getElementById('postMetaDesc');
      var keywords = document.getElementById('postKeywords');
      var content = document.getElementById('postContent');

      var providerSelect = document.getElementById('aiProvider');
      var modelSelect = document.getElementById('aiModel');
      var langSelect = document.getElementById('aiLang');

      if (!providerSelect) { DashUtils.showFlash('الرجاء ضبط إعدادات الذكاء الاصطناعي أولاً', 'error'); return; }
      var providerId = providerSelect.value;
      var modelId = modelSelect ? modelSelect.value : '';
      var lang = langSelect ? langSelect.value : 'ar';

      var postTitle = title ? title.value.trim() : '';
      if (!postTitle && field !== 'title') {
        DashUtils.showFlash('الرجاء إدخال عنوان المقال أولاً', 'error');
        return;
      }

      var systemPrompt = '';
      var userPrompt = '';
      var typeLabel = '';
      var maxTokens = 4096;

      var customContentPrompt = document.getElementById('postContentPrompt') ? document.getElementById('postContentPrompt').value.trim() : '';

      switch (field) {
        case 'title':
          typeLabel = 'عنوان';
          systemPrompt = 'أنت كاتب محتوى متخصص في أدوات الويب. مهمتك توليد عنوان جذاب ومحسّن لمحركات البحث.';
          userPrompt = 'اقترح 3 عناوين جذابة ومحسّنة لمحركات البحث لمقال أو أداة ويب باللغة العربية. كن مبدعاً. أعد العناوين فقط مفصولة بسطر جديد.';
          maxTokens = 512;
          break;
        case 'excerpt':
          typeLabel = 'وصف قصير';
          systemPrompt = 'أنت كاتب محتوى متخصص في أدوات الويب. مهمتك كتابة وصف قصير احترافي لا يتجاوز 160 حرفاً. كن مباشراً وواضحاً.';
          userPrompt = 'اكتب وصفاً قصيراً من 150-160 حرفاً فقط (بدون زيادة) للأداة "' + postTitle + '" باللغة العربية.';
          maxTokens = 512;
          break;
        case 'meta':
          typeLabel = 'وصف SEO';
          systemPrompt = 'أنت خبير تحسين محركات البحث (SEO). اكتب وصفاً تعريفياً (Meta Description) بين 300-320 حرفاً مع كلمات مفتاحية مناسبة.';
          userPrompt = 'اكتب وصفاً لمحركات البحث (Meta Description) من 300-320 حرفاً فقط عن "' + postTitle + '" باللغة العربية.';
          maxTokens = 1024;
          break;
        case 'keywords':
          typeLabel = 'كلمات مفتاحية';
          systemPrompt = 'أنت خبير SEO. مهمتك توليد كلمات مفتاحية ذات صلة.';
          userPrompt = 'اقترح 10-15 كلمة مفتاحية متخصصة باللغة العربية عن "' + postTitle + '"، مفصولة بفواصل.';
          maxTokens = 512;
          break;
        case 'image_name':
          typeLabel = 'اسم ملف الصورة';
          systemPrompt = 'أنت خبير SEO تقني. مهمتك توليد اسم ملف صورة محسّن لمحركات البحث (SEO-friendly image filename) باللغة الإنجليزية، مفصول بشرطات، بدون مسافات أو رموز خاصة، وبدون امتداد الملف.';
          userPrompt = 'أنشئ اسم ملف صورة محسّن لمحركات البحث للمقال "' + postTitle + '". الشروط: باللغة الإنجليزية فقط، كلمات مفصولة بشرطات (-)، بدون مسافات، بدون امتداد (لا .jpg ولا .png)، قصير ووصفي ومرتبط بالموضوع. أعد الاسم فقط بدون أي شرح.';
          maxTokens = 256;
          break;
        case 'image_alt':
          typeLabel = 'نص الصورة البديل';
          systemPrompt = 'أنت خبير SEO ومحسن إمكانية الوصول (Accessibility). مهمتك كتابة نص بديل للصورة (alt text) وصفي ودقيق ومحسّن لمحركات البحث، بين 100-125 حرفاً.';
          userPrompt = 'اكتب نصاً بديلاً للصورة (alt text) للمقال "' + postTitle + '" باللغة العربية. الشروط: وصفي ودقيق يشرح محتوى الصورة، بين 100-125 حرفاً، يحتوي على الكلمة المفتاحية الأساسية بشكل طبيعي، بدون كلمات زائدة مثل "صورة" أو "صورة لـ". أعد النص فقط.';
          maxTokens = 256;
          break;
        case 'content':
          typeLabel = 'محتوى';
          if (customContentPrompt) {
            systemPrompt = 'أنت كاتب محتوى محترف وخبير SEO متقدم. اكتب محتوى المقال باللغة العربية الفصحى مع الالتزام الصارم بالتعليمات المخصصة التي يطلبها المستخدم. استخدم وسوم HTML النظيفة للتنسيق (h2, h3, p, ul, li, strong) ويمنع استخدام النجوم أو الماركداون.';
            userPrompt = 'موضوع المقال: "' + postTitle + '".\nتعليمات مخصصة يجب الالتزام بها بدقة:\n' + customContentPrompt + '\n\nاكتب المحتوى الآن مع الالتزام بكل التعليمات أعلاه.';
            maxTokens = 16384;
          } else {
            systemPrompt = 'أنت كاتب محتوى محترف وخبير سيو (SEO) متقدم للغاية. اكتب نبذة تعريفية احترافية شاملة ومفصلة عن الأداة المطلوبة باللغة العربية الفصحى. يجب أن تلتزم التزاماً صارماً بالشروط التالية:\n1. طول النص: يجب أن يكون طول النص المولد بين 600 إلى 800 كلمة حصراً دون أي زيادة أو نقصان.\n2. الرموز والماركداون: يمنع منعاً باتاً استخدام أي نجوم مثل (* أو **) أو علامات ماركداون أو رموز غريبة في النص. استخدم فقط وسوم HTML النظيفة للتنسيق (h2, h3, p, ul, li, strong).\n3. أسلوب الكتابة: يجب أن يكون الأسلوب احترافياً، طبيعياً، وسلساً للغاية وكأنه مكتوب بواسطة كاتب بشري خبير، وبطريقة تفاعلية وممتعة تمنع ملل القارئ تماماً.\n4. توزيع الكلمات المفتاحية والسيو: وزع الكلمة المفتاحية الأساسية والكلمات الرئيسية بذكاء وتوازن بناءً على طول النص، على ألا تتجاوز كثافة تكرار أي كلمة مفتاحية نسبة 3% من إجمالي النص لضمان توافق السيو وتفادي الحشو (Keyword Stuffing). أضف كلمات مرادفة وكلمات مساندة ومصطلحات LSI تدعم المعنى وتقوي النص سياقياً.\n5. معايير E-E-A-T: حقق بدقة المعايير الأربعة لمحركات البحث E-E-A-T (الخبرة العملية Experience بتقديم إرشادات مفيدة، التخصص والخبرة العلمية Expertise، ومصداقية وسلطة المحتوى Authoritativeness، والموثوقية والأمان Trustworthiness)، بحيث لا تقل نتيجة تقييم كل معيار عن 9/10 بشكل طبيعي ومقنع جداً.\n6. سكيما البيانات المنظمة: في نهاية النص، أضف كود سكيما مقال Article بصيغة JSON-LD داخل وسم <script type="application/ld+json"> يحتوي على headline و description و datePublished و author و publisher.';
            userPrompt = 'اكتب نبذة تعريفية شاملة ومقال سيو متكامل عن "' + postTitle + '" باللغة العربية الفصحى. الكلمة المفتاحية الأساسية هي "' + postTitle + '". الشروط الهامة التي يجب تطبيقها بحذافيرها:\n1. طول النص الكلي يجب أن يتراوح بين 600 إلى 800 كلمة حصراً.\n2. استخدم وسوم HTML لتنسيق النص (h2, h3, p, ul, li, strong).\n3. يمنع استخدام النجوم (* أو **) أو علامات الماركداون أو أي رموز غريبة تماماً.\n4. يجب أن يكون أسلوب الصياغة بشرياً، طبيعياً، احترافياً، ومنسقاً بشكل يسهل قراءته دون ملل.\n5. وزّع الكلمات المفتاحية طبيعياً، بحيث لا تتجاوز نسبة تكرار الكلمة المفتاحية الأساسية أو أي كلمة مفتاحية 3% من النص. استخدم مرادفات لغوية وكلمات مساندة ومصطلحات LSI تدعم الفكرة.\n6. يجب إظهار جودة معايير E-E-A-T الأربعة (الخبرة، التخصص، السلطة، الموثوقية) بشكل احترافي يضمن تقييماً لا يقل عن 9/10 لكل معيار.\n7. أضف سكيما Article بصيغة JSON-LD داخل وسم <script type=\"application/ld+json\"> في نهاية النص.';
            maxTokens = 16384;
          }
          break;
        case 'content_custom':
          typeLabel = 'محتوى مخصص';
          if (!customContentPrompt) {
            DashUtils.showFlash('الرجاء كتابة تعليماتك في مربع الأوامر المخصص أولاً', 'error');
            return;
          }
          systemPrompt = 'أنت كاتب محتوى محترف وخبير SEO متقدم. اكتب محتوى المقال باللغة العربية الفصحى مع الالتزام الصارم بالتعليمات المخصصة التي يطلبها المستخدم. استخدم وسوم HTML النظيفة للتنسيق (h2, h3, p, ul, li, strong) ويمنع استخدام النجوم أو الماركداون.';
          userPrompt = 'موضوع المقال: "' + postTitle + '".\nتعليمات مخصصة يجب الالتزام بها بدقة:\n' + customContentPrompt + '\n\nاكتب المحتوى الآن مع الالتزام بكل التعليمات أعلاه.';
          maxTokens = 16384;
          break;
      }

      if (lang === 'en') {
        systemPrompt = systemPrompt.replace(/باللغة العربية/g, 'in English').replace(/اللغة/g, 'language');
        userPrompt = userPrompt.replace(/باللغة العربية/g, 'in English').replace(/اكتب/g, 'Write').replace(/أنشئ/g, 'Create');
      } else if (lang === 'fr') {
        systemPrompt = systemPrompt.replace(/باللغة العربية/g, 'en français').replace(/اللغة/g, 'langue');
        userPrompt = userPrompt.replace(/باللغة العربية/g, 'en français').replace(/اكتب/g, 'Écris').replace(/أنشئ/g, 'Crée');
      }

      DashUtils.showLoading('جاري توليد ' + typeLabel + ' بالذكاء الاصطناعي...');

      window.BlogAPI.callAI(providerId, modelId, systemPrompt, userPrompt, maxTokens)
        .then(function(text) {
          DashUtils.hideLoading();
          var cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
          var imageName = document.getElementById('postImageName');
          var imageAlt = document.getElementById('postImageAlt');
          switch (field) {
            case 'title':
              self._setGeneratedValue(title, cleaned.trim());
              break;
            case 'excerpt':
              self._setGeneratedValue(excerpt, cleaned.trim().substring(0, 160));
              break;
            case 'meta':
              self._setGeneratedValue(metaDesc, cleaned.trim().substring(0, 320));
              break;
            case 'keywords':
              self._setGeneratedValue(keywords, cleaned.trim());
              break;
            case 'image_name':
              var nameVal = cleaned.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase();
              if (imageName) self._setGeneratedValue(imageName, nameVal);
              break;
            case 'image_alt':
              if (imageAlt) self._setGeneratedValue(imageAlt, cleaned.trim().substring(0, 125));
              break;
            case 'content':
            case 'content_custom':
              self._setGeneratedValue(content, cleaned.trim());
              break;
          }
          DashUtils.showFlash('تم توليد ' + typeLabel + ' بنجاح', 'success');
        })
        .catch(function(err) {
          DashUtils.hideLoading();
          DashUtils.showFlash('خطأ في التوليد: ' + err.message, 'error');
        });
    },

    _aiGenerateAll: function() {
      var self = this;
      var title = document.getElementById('postTitle');
      var excerpt = document.getElementById('postExcerpt');
      var metaDesc = document.getElementById('postMetaDesc');
      var keywords = document.getElementById('postKeywords');
      var content = document.getElementById('postContent');

      var providerSelect = document.getElementById('aiProvider');
      var modelSelect = document.getElementById('aiModel');
      var langSelect = document.getElementById('aiLang');
      var genType = document.getElementById('aiGenType');

      if (!providerSelect) { DashUtils.showFlash('الرجاء ضبط إعدادات الذكاء الاصطناعي أولاً', 'error'); return; }
      var providerId = providerSelect.value;
      var modelId = modelSelect ? modelSelect.value : '';
      var lang = langSelect ? langSelect.value : 'ar';
      var type = genType ? genType.value : 'short_desc';

      var postTitle = title ? title.value.trim() : '';
      if (!postTitle) {
        DashUtils.showFlash('الرجاء إدخال عنوان المقال أولاً', 'error');
        return;
      }

      var customCodePrompt = document.getElementById('aiCodePrompt') ? document.getElementById('aiCodePrompt').value.trim() : '';

      var systemPrompts = {
        'short_desc': 'أنت كاتب محتوى متخصص في أدوات الويب. مهمتك كتابة وصف قصير احترافي لا يتجاوز 160 حرفاً. كن مباشراً وواضحاً.',
        'meta_desc': 'أنت خبير تحسين محركات البحث (SEO). اكتب وصفاً تعريفياً (Meta Description) بين 300-320 حرفاً مع كلمات مفتاحية مناسبة.',
        'long_desc': 'أنت كاتب محتوى محترف وخبير سيو (SEO) متقدم للغاية. اكتب نبذة تعريفية احترافية شاملة ومفصلة عن الأداة المطلوبة باللغة العربية الفصحى. يجب أن تلتزم التزاماً صارماً بالشروط التالية:\n1. طول النص: يجب أن يكون طول النص المولد بين 600 إلى 800 كلمة حصراً دون أي زيادة أو نقصان.\n2. الرموز والماركداون: يمنع منعاً باتاً استخدام أي نجوم مثل (* أو **) أو علامات ماركداون أو رموز غريبة في النص. استخدم فقط وسوم HTML النظيفة للتنسيق (h2, h3, p, ul, li, strong).\n3. أسلوب الكتابة: يجب أن يكون الأسلوب احترافياً، طبيعياً، وسلساً للغاية وكأنه مكتوب بواسطة كاتب بشري خبير، وبطريقة تفاعلية وممتعة تمنع ملل القارئ تماماً.\n4. توزيع الكلمات المفتاحية والسيو: وزع الكلمة المفتاحية الأساسية والكلمات الرئيسية بذكاء وتوازن بناءً على طول النص، على ألا تتجاوز كثافة تكرار أي كلمة مفتاحية نسبة 3% من إجمالي النص لضمان توافق السيو وتفادي الحشو (Keyword Stuffing). أضف كلمات مرادفة وكلمات مساندة ومصطلحات LSI تدعم المعنى وتقوي النص سياقياً.\n5. معايير E-E-A-T: حقق بدقة المعايير الأربعة لمحركات البحث E-E-A-T (الخبرة العملية Experience بتقديم إرشادات مفيدة، التخصص والخبرة العلمية Expertise، ومصداقية وسلطة المحتوى Authoritativeness، والموثوقية والأمان Trustworthiness)، بحيث لا تقل نتيجة تقييم كل معيار عن 9/10 بشكل طبيعي ومقنع جداً.\n6. سكيما البيانات المنظمة: في نهاية النص، أضف كود سكيما مقال Article بصيغة JSON-LD داخل وسم <script type="application/ld+json"> يحتوي على headline و description و datePublished و author و publisher.',
        'faq': 'أنشئ 5 إلى 8 أسئلة شائعة متقدمة مع إجاباتها عن الأداة. أعد النتيجة بتنسيق JSON فقط: [{"q":"السؤال","a":"الإجابة"}]. يجب أن تحتوي الأسئلة على الكلمة المفتاحية الأساسية أو كلمات مفتاحية واضحة. يجب أن تحتوي الإجابات على كلمات مفتاحية مشابهة ومساندة ومرادفة. الأسئلة تغطي: طريقة الاستخدام خطوة بخطوة، الفوائد والمميزات، المشاكل الشائعة والحلول، التوافق والمتطلبات، مقارنة مع أدوات مشابهة.',
        'generate_code': 'أنت مبرمج متخصص في أدوات الويب. مهمتك إنشاء كود HTML/CSS/JS للأداة المطلوبة فقط. لا تضف أي كود لتنسيق الصفحة كاملة (لا html, body, header, footer, layout عام). أعد النتيجة بتنسيق JSON فقط: {"html":"...","css":"...","js":"..."}. الكود خاص بالأداة فقط باستخدام كلاسات مميزة مثل .tool-... لتجنب التداخل مع تصميم الصفحة. كود نظيف ومتجاوب مع تصميم عصري.',
        'keywords': 'أنت خبير SEO. مهمتك توليد كلمات مفتاحية ذات صلة.'
      };

      var userPrompts = {
        'short_desc': 'اكتب وصفاً قصيراً من 150-160 حرفاً فقط (بدون زيادة) للأداة "' + postTitle + '" باللغة العربية.',
        'meta_desc': 'اكتب وصفاً لمحركات البحث (Meta Description) من 300-320 حرفاً فقط عن "' + postTitle + '" باللغة العربية.',
        'long_desc': 'اكتب نبذة تعريفية شاملة ومقال سيو متكامل عن "' + postTitle + '" باللغة العربية الفصحى. الكلمة المفتاحية الأساسية هي "' + postTitle + '". الشروط الهامة التي يجب تطبيقها بحذافيرها:\n1. طول النص الكلي يجب أن يتراوح بين 600 إلى 800 كلمة حصراً.\n2. استخدم وسوم HTML لتنسيق النص (h2, h3, p, ul, li, strong).\n3. يمنع استخدام النجوم (* أو **) أو علامات الماركداون أو أي رموز غريبة تماماً.\n4. يجب أن يكون أسلوب الصياغة بشرياً، طبيعياً، احترافياً، ومنسقاً بشكل يسهل قراءته دون ملل.\n5. وزّع الكلمات المفتاحية طبيعياً، بحيث لا تتجاوز نسبة تكرار الكلمة المفتاحية الأساسية أو أي كلمة مفتاحية 3% من النص. استخدم مرادفات لغوية وكلمات مساندة ومصطلحات LSI تدعم الفكرة.\n6. يجب إظهار جودة معايير E-E-A-T الأربعة (الخبرة، التخصص، السلطة، الموثوقية) بشكل احترافي يضمن تقييماً لا يقل عن 9/10 لكل معيار.\n7. أضف سكيما Article بصيغة JSON-LD داخل وسم <script type=\"application/ld+json\"> في نهاية النص.',
        'faq': 'أنشئ 5 إلى 8 أسئلة شائعة متقدمة مع إجاباتها عن "' + postTitle + '". الأسئلة تحتوي على كلمات مفتاحية واضحة والإجابات تحتوي على كلمات مشابهة ومساندة. أعد JSON فقط: [{"q":"السؤال","a":"الإجابة"}] باللغة العربية.',
        'generate_code': 'أنشئ كود كامل لأداة: "' + (customCodePrompt || postTitle) + '". أعد JSON فقط: {"html":"...","css":"...","js":"..."}. مهم جداً: لا تضف html, body, div wrapper عام أو تنسيق صفحة كاملة. استخدم كلاسات خاصة مثل .tool-... فقط للأداة. كود HTML معاصر، CSS أنيق ومتجاوب بدون تداخل مع الصفحة.',
        'keywords': 'اقترح 10-15 كلمة مفتاحية متخصصة عن "' + postTitle + '" باللغة العربية، مفصولة بفواصل.'
      };

      if (lang === 'en') {
        for (var k in userPrompts) { userPrompts[k] = userPrompts[k].replace(/باللغة العربية/g, 'in English'); }
        for (var k in systemPrompts) { systemPrompts[k] = systemPrompts[k].replace(/باللغة العربية/g, 'in English'); }
      } else if (lang === 'fr') {
        for (var k in userPrompts) { userPrompts[k] = userPrompts[k].replace(/باللغة العربية/g, 'en français'); }
        for (var k in systemPrompts) { systemPrompts[k] = systemPrompts[k].replace(/باللغة العربية/g, 'en français'); }
      }

      var systemMsg = systemPrompts[type] || systemPrompts['short_desc'];
      var userMsg = userPrompts[type] || userPrompts['short_desc'];
      var maxTokens = (type === 'long_desc' || type === 'faq' || type === 'generate_code') ? 16384 : 8192;

      DashUtils.showLoading('جاري توليد المحتوى...');

      window.BlogAPI.callAI(providerId, modelId, systemMsg, userMsg, maxTokens)
        .then(function(text) {
          DashUtils.hideLoading();
          var cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
          if (type === 'short_desc' && excerpt) {
            self._setGeneratedValue(excerpt, cleaned.trim().substring(0, 160));
          } else if (type === 'meta_desc' && metaDesc) {
            self._setGeneratedValue(metaDesc, cleaned.trim().substring(0, 320));
          } else if (type === 'long_desc' && content) {
            self._setGeneratedValue(content, cleaned.trim());
          } else if (type === 'keywords' && keywords) {
            self._setGeneratedValue(keywords, cleaned.trim());
          } else if (type === 'generate_code' && content) {
            try {
              var firstBrace = cleaned.indexOf('{');
              var lastBrace = cleaned.lastIndexOf('}');
              var jsonStr = (firstBrace !== -1 && lastBrace > firstBrace) ? cleaned.substring(firstBrace, lastBrace + 1) : cleaned;
              jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
              var codeData = JSON.parse(jsonStr);
              var codeHtml = '';
              if (codeData.html) codeHtml += '<!-- HTML -->\n' + codeData.html + '\n\n';
              if (codeData.css) codeHtml += '<style>\n' + codeData.css + '\n</style>\n\n';
              if (codeData.js) codeHtml += '<script>\n' + codeData.js + '\n<\/script>';
              self._setGeneratedValue(content, codeHtml || cleaned);
            } catch(e) {
              self._setGeneratedValue(content, cleaned);
            }
          } else if (type === 'faq') {
            try {
              var faqData = JSON.parse(cleaned);
              var faqHtml = faqData.map(function(item) { return '<h3>' + item.q + '</h3><p>' + item.a + '</p>'; }).join('');
              self._setGeneratedValue(content, faqHtml);
            } catch(e) {
              self._setGeneratedValue(content, cleaned);
            }
          }
          DashUtils.showFlash('تم توليد المحتوى بنجاح', 'success');
        })
        .catch(function(err) {
          DashUtils.hideLoading();
          DashUtils.showFlash('خطأ في التوليد: ' + err.message, 'error');
        });
    },

    _toggleCustomPrompt: function() {
      var genType = document.getElementById('aiGenType');
      var promptWrap = document.getElementById('customPromptWrap');
      if (genType && promptWrap) {
        promptWrap.style.display = genType.value === 'generate_code' ? 'block' : 'none';
      }
    },

    renderCategories: function() {
      var app = document.getElementById('dashApp');
      if (!app) return;
      var self = this;
      var cats = self._getCategories();
      var posts = window.BlogAPI.getPosts();

      var catsHtml = cats.sort(function(a,b) { return (a.order || 99) - (b.order || 99); }).map(function(c) {
        var count = posts.filter(function(p) { return p.category_id === c.id; }).length;
        return '<div class="category-card" id="catCard-' + c.id + '">' +
          '<div class="category-color" style="background:' + c.color + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + (c.icon || '') + '</svg></div>' +
          '<div class="category-info"><h4>' + self._escHtml(c.name_ar || c.id) + ' <span style="font-weight:400;font-size:.7rem;color:#94a3b8">(' + self._escHtml(c.name_en || '') + ')</span>' +
          ' <span style="font-size:.65rem;color:#CBD5E1;font-family:monospace;direction:ltr;display:inline-block">[' + self._escHtml(c.slug || c.id) + ']</span></h4>' +
          '<p>' + self._escHtml(c.desc_ar || '') + '</p></div>' +
          '<span class="category-count">' + count + ' مقال</span>' +
          '<div class="actions" style="gap:2px">' +
          '<button class="action-btn edit-btn" onclick="DashApp._editCategory(\'' + c.id + '\')" title="تعديل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
          '<button class="action-btn delete-btn" onclick="DashApp._deleteCategory(\'' + c.id + '\')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div>' +
          '</div>';
      }).join('');

      app.innerHTML =
        '<div class="page-head"><h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg> إدارة التصنيفات</h1>' +
        '<button class="btn btn-primary btn-sm" onclick="DashApp._showAddCategoryForm()">➕ إضافة تصنيف</button></div>' +
        '<div class="card" id="catAddForm" style="display:none;border:2px dashed #6366F1;margin-bottom:20px">' +
        '<div class="card-header"><h3 class="card-title">إضافة تصنيف جديد</h3></div>' +
        '<div style="padding:0 24px 24px">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>الاسم (عربي)</label><input class="form-control" id="newCatNameAr"></div>' +
        '<div class="form-group"><label>الاسم (إنجليزي)</label><input class="form-control" id="newCatNameEn"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>المعرف (Slug)</label><input class="form-control" id="newCatSlug" placeholder="my-category" dir="ltr" style="text-align:left"><div class="hint">سيستخدم في رابط التصنيف</div></div>' +
        '<div class="form-group"><label>اللون</label><input class="form-control" id="newCatColor" type="color" value="#6366F1" style="height:42px;padding:4px"></div>' +
        '</div>' +
        '<div class="form-group"><label>الوصف</label><textarea class="form-control" id="newCatDesc" rows="2"></textarea></div>' +
        '<div class="form-group"><label>الأيقونة (SVG path)</label><textarea class="form-control" id="newCatIcon" rows="2" dir="ltr" style="text-align:left;font-family:monospace;font-size:.78rem" placeholder="&lt;path d=&quot;...&quot;/&gt;"></textarea></div>' +
        '<div class="form-actions" style="border-top:none;margin-top:8px;padding-top:0">' +
        '<button class="btn btn-success" onclick="DashApp._saveNewCategory()">💾 حفظ التصنيف</button>' +
        '<button class="btn btn-outline" onclick="document.getElementById(\'catAddForm\').style.display=\'none\'">إلغاء</button>' +
        '</div></div></div>' +
        '<div class="card" id="catEditForm" style="display:none;border:2px solid #F59E0B;margin-bottom:20px">' +
        '<div class="card-header"><h3 class="card-title">✏️ تعديل التصنيف</h3></div>' +
        '<div style="padding:0 24px 24px">' +
        '<input type="hidden" id="editCatId">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>الاسم (عربي)</label><input class="form-control" id="editCatNameAr"></div>' +
        '<div class="form-group"><label>الاسم (إنجليزي)</label><input class="form-control" id="editCatNameEn"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>المعرف (Slug)</label><input class="form-control" id="editCatSlug" placeholder="my-category" dir="ltr" style="text-align:left"><div class="hint">تحذير: تغيير slug سيؤثر على روابط المقالات</div></div>' +
        '<div class="form-group"><label>اللون</label><input class="form-control" id="editCatColor" type="color" value="#6366F1" style="height:42px;padding:4px"></div>' +
        '</div>' +
        '<div class="form-group"><label>الوصف</label><textarea class="form-control" id="editCatDesc" rows="2"></textarea></div>' +
        '<div class="form-group"><label>الأيقونة (SVG path)</label><textarea class="form-control" id="editCatIcon" rows="2" dir="ltr" style="text-align:left;font-family:monospace;font-size:.78rem"></textarea></div>' +
        '<div class="form-actions" style="border-top:none;margin-top:8px;padding-top:0">' +
        '<button class="btn btn-primary" onclick="DashApp._saveEditCategory()">💾 حفظ التعديلات</button>' +
        '<button class="btn btn-outline" onclick="document.getElementById(\'catEditForm\').style.display=\'none\'">إلغاء</button>' +
        '</div></div></div>' +
        '<div class="card"><div class="card-header"><h3 class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg> جميع التصنيفات (' + cats.length + ')</h3></div>' +
        '<div id="categoriesList">' + catsHtml + '</div></div>';
    },

    _getCategories: function() {
      var cats = [];
      try { cats = JSON.parse(localStorage.getItem('dash_categories') || '[]'); } catch(e) {}
      if (cats.length === 0) {
        cats = [
          {id:'text-tools',slug:'text-tools',name_ar:'أدوات النصوص والكلمات',name_en:'Text & Word Tools',desc_ar:'أدوات تحرير النصوص وتحليل الكلمات وعدد الأحرف والترجمة والتدقيق الإملائي',color:'#6366F1',icon:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',order:1},
          {id:'Developer',slug:'Developer',name_ar:'أدوات المطورين',name_en:'Developer Tools',desc_ar:'أدوات البرمجة وتطوير الويب وإنشاء الأكواد واختبار المواقع',color:'#10B981',icon:'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',order:2},
          {id:'Photo-Editing',slug:'Photo-Editing',name_ar:'أدوات الصور والتصميم',name_en:'Photo & Design Tools',desc_ar:'أدوات تحرير الصور والتصميم الجرافيكي ومعالجة الصور أونلاين',color:'#F59E0B',icon:'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',order:3},
          {id:'Calculators',slug:'Calculators',name_ar:'أدوات الحاسبة',name_en:'Calculator Tools',desc_ar:'حاسبات رياضية ومالية وتعليمية وصحية تساعدك في حساباتك اليومية',color:'#3B82F6',icon:'<rect width="20" height="20" x="2" y="2" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/>',order:4},
          {id:'docs-tools',slug:'docs-tools',name_ar:'أدوات PDF والمستندات',name_en:'PDF & Document Tools',desc_ar:'أدوات تحرير ودمج وتقسيم وتحويل ملفات PDF بكل سهولة',color:'#EC4899',icon:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',order:5},
          {id:'zip-tools',slug:'zip-tools',name_ar:'أدوات ZIP والضغط',name_en:'ZIP & Compression Tools',desc_ar:'أدوات ضغط وفك ضغط الملفات وإدارة الأرشيفات بكفاءة عالية',color:'#059669',icon:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',order:6},
          {id:'seo',slug:'seo',name_ar:'أدوات SEO',name_en:'SEO Tools',desc_ar:'أدوات تحسين محركات البحث لتحليل ومراقبة أداء موقعك',color:'#14B8A6',icon:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m9 8 5 3-5 3V8z"/>',order:7},
          {id:'General',slug:'General',name_ar:'أدوات متنوعة',name_en:'General Tools',desc_ar:'أدوات عامة متنوعة مثل QR Code والمؤقت والمواقيت والتاريخ',color:'#F59E0B',icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',order:8},
          {id:'Social-media',slug:'Social-media',name_ar:'أدوات سوشيال ميديا',name_en:'Social Media Tools',desc_ar:'أدوات إدارة حسابات السوشيال ميديا وتحليل التفاعل وتحميل المحتوى',color:'#8B5CF6',icon:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',order:9}
        ];
      }
      return cats;
    },

    _showAddCategoryForm: function() {
      var form = document.getElementById('catAddForm');
      var editForm = document.getElementById('catEditForm');
      if (editForm) editForm.style.display = 'none';
      if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
          document.getElementById('newCatNameAr').focus();
        }
      }
    },

    _saveNewCategory: function() {
      var nameAr = document.getElementById('newCatNameAr').value.trim();
      var nameEn = document.getElementById('newCatNameEn').value.trim();
      var slug = document.getElementById('newCatSlug').value.trim();
      var color = document.getElementById('newCatColor').value;
      var desc = document.getElementById('newCatDesc').value.trim();
      var icon = document.getElementById('newCatIcon').value.trim();

      if (!nameAr) { DashUtils.showFlash('الرجاء إدخال اسم التصنيف بالعربية', 'error'); return; }
      if (!slug) { slug = nameAr.replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'cat-' + Date.now(); }

      var cats = this._getCategories();
      if (cats.find(function(c) { return c.id === slug || c.slug === slug; })) {
        DashUtils.showFlash('هذا المعرف (slug) موجود مسبقاً', 'error');
        return;
      }

      cats.push({
        id: slug,
        slug: slug,
        name_ar: nameAr,
        name_en: nameEn || nameAr,
        desc_ar: desc,
        color: color || '#6366F1',
        icon: icon || '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        order: cats.length + 1
      });

      localStorage.setItem('dash_categories', JSON.stringify(cats));
      DashUtils.showFlash('تم إضافة التصنيف بنجاح', 'success');
      document.getElementById('catAddForm').style.display = 'none';
      document.getElementById('newCatNameAr').value = '';
      document.getElementById('newCatNameEn').value = '';
      document.getElementById('newCatSlug').value = '';
      document.getElementById('newCatDesc').value = '';
      document.getElementById('newCatIcon').value = '';
      this.renderCategories();
    },

    _editCategory: function(catId) {
      var cats = this._getCategories();
      var cat = cats.find(function(c) { return c.id === catId; });
      if (!cat) { DashUtils.showFlash('التصنيف غير موجود', 'error'); return; }

      var addForm = document.getElementById('catAddForm');
      if (addForm) addForm.style.display = 'none';

      var form = document.getElementById('catEditForm');
      if (!form) return;
      form.style.display = 'block';
      document.getElementById('editCatId').value = cat.id;
      document.getElementById('editCatNameAr').value = cat.name_ar || '';
      document.getElementById('editCatNameEn').value = cat.name_en || '';
      document.getElementById('editCatSlug').value = cat.slug || cat.id;
      document.getElementById('editCatColor').value = cat.color || '#6366F1';
      document.getElementById('editCatDesc').value = cat.desc_ar || '';
      document.getElementById('editCatIcon').value = cat.icon || '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _saveEditCategory: function() {
      var catId = document.getElementById('editCatId').value;
      var nameAr = document.getElementById('editCatNameAr').value.trim();
      var nameEn = document.getElementById('editCatNameEn').value.trim();
      var slug = document.getElementById('editCatSlug').value.trim();
      var color = document.getElementById('editCatColor').value;
      var desc = document.getElementById('editCatDesc').value.trim();
      var icon = document.getElementById('editCatIcon').value.trim();

      if (!nameAr) { DashUtils.showFlash('الرجاء إدخال اسم التصنيف', 'error'); return; }
      if (!slug) { DashUtils.showFlash('الرجاء إدخال slug', 'error'); return; }

      var cats = this._getCategories();
      var idx = cats.findIndex(function(c) { return c.id === catId; });
      if (idx === -1) { DashUtils.showFlash('التصنيف غير موجود', 'error'); return; }

      var existing = cats.findIndex(function(c) { return (c.id === slug || c.slug === slug) && c.id !== catId; });
      if (existing !== -1 && slug !== cats[idx].id) {
        if (!confirm('هذا slug مستخدم من قبل تصنيف آخر. هل تريد المتابعة؟')) return;
      }

      cats[idx] = {
        id: slug,
        slug: slug,
        name_ar: nameAr,
        name_en: nameEn || nameAr,
        desc_ar: desc,
        color: color || '#6366F1',
        icon: icon || cats[idx].icon,
        order: cats[idx].order || idx + 1
      };

      localStorage.setItem('dash_categories', JSON.stringify(cats));
      DashUtils.showFlash('تم حفظ التعديلات بنجاح', 'success');
      document.getElementById('catEditForm').style.display = 'none';
      this.renderCategories();
    },

    _deleteCategory: function(catId) {
      if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
      var cats = this._getCategories();
      cats = cats.filter(function(c) { return c.id !== catId; });
      localStorage.setItem('dash_categories', JSON.stringify(cats));
      DashUtils.showFlash('تم حذف التصنيف بنجاح', 'success');
      this.renderCategories();
    },

    renderSettings: function() {
      var app = document.getElementById('dashApp');
      if (!app) return;
      var self = this;
      var settings = window.BlogAPI.getSettings();

      var aiData = window.BlogAPI.getAIProviders();
      if (aiData && aiData.then) {
        aiData.then(function(d) {
          window.BlogAPI.saveAIProviders(d);
          self._renderSettingsPage(app, settings, d);
        }).catch(function() {
          var def = self._getDefaultAIProviders();
          window.BlogAPI.saveAIProviders(def);
          self._renderSettingsPage(app, settings, def);
        });
        app.innerHTML = '<div class="page-head"><h1>جاري التحميل...</h1></div>';
        return;
      }
      this._renderSettingsPage(app, settings, aiData || {providers:[], selected_provider:'openrouter', selected_model:''});
    },

    _renderSettingsPage: function(app, settings, aiData) {
      var self = this;
      var providersList = aiData && aiData.providers ? aiData.providers : [];

      var providersHtml = providersList.map(function(p, idx) {
        var keyDisplay = p.api_key ? p.api_key.substring(0, 12) + '...' : '';
        var modelOptions = (p.models || []).map(function(m) {
          return '<option value="' + self._escHtml(m.id) + '" ' + (m.id === p.default_model ? 'selected' : '') + '>' + self._escHtml(m.name || m.id) + '</option>';
        }).join('');
        var modelsHtml = p.models.map(function(m) {
          return '<span style="font-size:.72rem;color:#64748b;background:#F1F5F9;padding:2px 8px;border-radius:4px;display:inline-block;margin:2px">' + self._escHtml(m.name || m.id) + '</span>';
        }).join('');
        return '<div class="ai-provider-card" data-provider-id="' + p.id + '" style="background:#FAFAFA;border:1px solid #F1F5F9;border-radius:10px;padding:16px;margin-bottom:12px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<h4 style="font-size:.85rem;font-weight:700">' + self._escHtml(p.name_ar || p.name) + '</h4>' +
          '<button type="button" class="btn btn-sm btn-danger" onclick="DashApp._removeProvider(\'' + p.id + '\')" style="padding:4px 10px;font-size:.7rem">✕</button>' +
          '</div>' +
          '<div style="margin-bottom:8px">' +
          '<label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">مفتاح API</label>' +
          '<div style="display:flex;gap:6px">' +
          '<input class="form-control ai-provider-key" data-provider-id="' + p.id + '" value="' + self._escHtml(p.api_key || '') + '" placeholder="أدخل مفتاح API" dir="ltr" style="text-align:left;font-size:.8rem;padding:8px 12px;font-family:monospace">' +
          '<button type="button" class="btn btn-sm btn-outline" onclick="var inp=this.previousElementSibling; inp.type=inp.type===\'password\'?\'text\':\'password\'; this.textContent=inp.type===\'password\'?\'👁️\':\'🙈\'" style="padding:4px 10px;font-size:.75rem">👁️</button>' +
          '</div>' +
          '</div>' +
          '<div style="margin-bottom:8px">' +
          '<label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">النموذج الافتراضي</label>' +
          '<select class="form-control ai-provider-default-model" data-provider-id="' + p.id + '" dir="ltr" style="text-align:left;font-size:.8rem;padding:8px 12px">' + modelOptions + '</select>' +
          '</div>' +
          '<div><label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">النماذج المتاحة</label>' +
          '<div>' + modelsHtml + '</div></div>' +
          '</div>';
      }).join('');

      app.innerHTML =
        '<div class="page-head"><h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> إعدادات المدونة</h1></div>' +
        '<div class="card">' +
        '<form id="settingsForm" onsubmit="return false;">' +
        '<h3 class="card-title" style="margin-bottom:16px">معلومات الموقع</h3>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>اسم الموقع</label><input class="form-control" id="setSiteName" value="' + self._escHtml(settings.site_name) + '"></div>' +
        '<div class="form-group"><label>رابط الموقع</label><input class="form-control" id="setSiteUrl" value="' + self._escHtml(settings.site_url) + '" dir="ltr" style="text-align:left"></div>' +
        '</div>' +
        '<div class="form-group"><label>عنوان المدونة</label><input class="form-control" id="setBlogTitle" value="' + self._escHtml(settings.blog_title) + '"></div>' +
        '<div class="form-group"><label>وصف المدونة</label><textarea class="form-control" id="setBlogDesc" rows="2">' + self._escHtml(settings.blog_desc) + '</textarea></div>' +
        '<hr class="form-divider">' +
        '<h3 class="card-title" style="margin-bottom:16px">التكامل مع GitHub</h3>' +
        '<div class="form-group"><label>GitHub Repository</label><input class="form-control" id="setGithubRepo" value="' + self._escHtml(settings.github_repo) + '" placeholder="username/repo" dir="ltr" style="text-align:left"><div class="hint">اسم المستخدم/اسم المستودع على GitHub</div></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>الفرع (Branch)</label><input class="form-control" id="setGithubBranch" value="' + self._escHtml(settings.github_branch) + '" dir="ltr" style="text-align:left"></div>' +
        '<div class="form-group"><label>المقالات في كل صفحة</label><input class="form-control" id="setPostsPerPage" type="number" value="' + (settings.posts_per_page || 9) + '" min="3" max="50"></div>' +
        '</div>' +
        '<hr class="form-divider">' +
        '<h3 class="card-title" style="margin-bottom:16px">روابط التواصل الاجتماعي</h3>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>فيسبوك</label><input class="form-control" id="setFacebook" value="' + self._escHtml(settings.facebook_url || '') + '" dir="ltr" style="text-align:left"></div>' +
        '<div class="form-group"><label>تويتر</label><input class="form-control" id="setTwitter" value="' + self._escHtml(settings.twitter_url || '') + '" dir="ltr" style="text-align:left"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>تليجرام</label><input class="form-control" id="setTelegram" value="' + self._escHtml(settings.telegram_url || '') + '" dir="ltr" style="text-align:left"></div>' +
        '<div class="form-group"><label>انستقرام</label><input class="form-control" id="setInstagram" value="' + self._escHtml(settings.instagram_url || '') + '" dir="ltr" style="text-align:left"></div>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="card" style="margin-top:24px">' +
        '<div class="card-header">' +
        '<h3 class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> مزودي الذكاء الاصطناعي</h3>' +
        '<button type="button" class="btn btn-sm btn-primary" onclick="DashApp._addProvider()">➕ إضافة مزود</button>' +
        '</div>' +
        '<div id="aiProvidersContainer" style="padding:0">' +
        providersHtml +
        '</div>' +
        '<div style="padding:16px;border-top:1px solid #E2E8F0;display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-primary" onclick="DashApp._saveAIProviders()">💾 حفظ مفاتيح API</button>' +
        '<span style="font-size:.72rem;color:#10B981">✅ حفظ تلقائي - يتم حفظ التغييرات فوراً</span>' +
        '<span style="font-size:.72rem;color:#94a3b8">يتم تخزين المفاتيح محلياً في المتصفح</span>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-top:20px">' +
        '<button type="submit" class="btn btn-primary btn-lg" id="saveSettingsBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> حفظ الإعدادات</button>' +
        '</div>';

      var self = this;
      document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        self._saveSettingsForm();
      });

      // Auto-save settings on input change (debounced)
      document.querySelectorAll('#settingsForm input, #settingsForm textarea').forEach(function(el) {
        el.addEventListener('input', self._debounce(function() {
          self._saveSettingsForm();
        }, 600));
      });

      // Auto-save AI provider keys on input change (silent)
      document.querySelectorAll('.ai-provider-key').forEach(function(el) {
        el.addEventListener('input', self._debounce(function() {
          self._saveAIProviders(true);
        }, 400));
      });

      document.querySelectorAll('.ai-provider-default-model').forEach(function(el) {
        el.addEventListener('change', function() {
          self._saveAIProviders(true);
        });
      });
    },

    _addProvider: function() {
      var providerId = 'custom_' + Date.now();
      var container = document.getElementById('aiProvidersContainer');
      if (!container) return;
      var div = document.createElement('div');
      div.className = 'ai-provider-card';
      div.setAttribute('data-provider-id', providerId);
      div.style.cssText = 'background:#FAFAFA;border:1px solid #F1F5F9;border-radius:10px;padding:16px;margin-bottom:12px';
      div.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<h4 style="font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:8px">' +
        '<input class="form-control" placeholder="اسم المزود" style="width:200px;font-size:.8rem;padding:6px 10px" data-provider-name="' + providerId + '">' +
        '</h4>' +
        '<button type="button" class="btn btn-sm btn-danger" onclick="this.closest(\'.ai-provider-card\').remove()" style="padding:4px 10px;font-size:.7rem">✕</button>' +
        '</div>' +
        '<div class="form-row" style="gap:8px">' +
        '<div class="form-group" style="margin-bottom:8px">' +
        '<label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">مفتاح API</label>' +
        '<input class="form-control" placeholder="مفتاح API" dir="ltr" style="text-align:left;font-size:.8rem;padding:8px 12px;font-family:monospace" data-provider-key="' + providerId + '">' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:8px">' +
        '<label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">رابط API</label>' +
        '<input class="form-control" placeholder="https://api.example.com/v1/chat/completions" dir="ltr" style="text-align:left;font-size:.8rem;padding:8px 12px;font-family:monospace" data-provider-endpoint="' + providerId + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:0">' +
        '<label style="font-size:.72rem;font-weight:600;color:#64748b;display:block;margin-bottom:3px">النموذج الافتراضي</label>' +
        '<input class="form-control" placeholder="gpt-4o-mini" dir="ltr" style="text-align:left;font-size:.8rem;padding:8px 12px;font-family:monospace" data-provider-model="' + providerId + '">' +
        '</div>';
      container.appendChild(div);
    },

    _removeProvider: function(providerId) {
      if (!confirm('هل أنت متأكد من إزالة هذا المزود؟')) return;
      var card = document.querySelector('.ai-provider-card[data-provider-id="' + providerId + '"]');
      if (card) card.remove();
      var aiData = window.BlogAPI.getAIProviders();
      if (aiData && aiData.providers) {
        aiData.providers = aiData.providers.filter(function(p) { return p.id !== providerId; });
        window.BlogAPI.saveAIProviders(aiData);
      }
    },

    _saveSettingsForm: function() {
      var newSettings = {
        site_name: document.getElementById('setSiteName').value,
        site_url: document.getElementById('setSiteUrl').value,
        blog_title: document.getElementById('setBlogTitle').value,
        blog_desc: document.getElementById('setBlogDesc').value,
        github_repo: document.getElementById('setGithubRepo').value,
        github_branch: document.getElementById('setGithubBranch').value,
        posts_per_page: parseInt(document.getElementById('setPostsPerPage').value) || 9,
        facebook_url: document.getElementById('setFacebook').value,
        twitter_url: document.getElementById('setTwitter').value,
        telegram_url: document.getElementById('setTelegram').value,
        instagram_url: document.getElementById('setInstagram').value
      };
      window.BlogAPI.saveSettings(newSettings);
    },

    _debounce: function(fn, delay) {
      var timer = null;
      return function() {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() { fn.apply(context, args); }, delay);
      };
    },

    _saveAIProviders: function(silent) {
      var aiData = window.BlogAPI.getAIProviders();
      if (!aiData || !aiData.providers) {
        aiData = { providers: [], selected_provider: 'openrouter', selected_model: '' };
      }

      document.querySelectorAll('.ai-provider-card').forEach(function(card) {
        var providerId = card.getAttribute('data-provider-id');
        var keyInput = card.querySelector('.ai-provider-key');
        var defaultModelInput = card.querySelector('.ai-provider-default-model');
        if (keyInput) {
          var provider = aiData.providers.find(function(p) { return p.id === providerId; });
          if (provider) {
            provider.api_key = keyInput.value;
            if (defaultModelInput) {
              provider.default_model = defaultModelInput.value;
            }
          }
        }

        var nameInput = card.querySelector('[data-provider-name]');
        var keyInput2 = card.querySelector('[data-provider-key]');
        var endpointInput = card.querySelector('[data-provider-endpoint]');
        var modelInput = card.querySelector('[data-provider-model]');
        if (nameInput && keyInput2) {
          var customId = nameInput.getAttribute('data-provider-name');
          var existing = aiData.providers.find(function(p) { return p.id === customId; });
          if (!existing) {
            aiData.providers.push({
              id: customId,
              name: nameInput.value || 'مزود مخصص',
              name_ar: nameInput.value || 'مزود مخصص',
              api_endpoint: endpointInput ? endpointInput.value : 'https://api.example.com/v1/chat/completions',
              api_key: keyInput2.value || '',
              default_model: modelInput ? modelInput.value : 'gpt-4o-mini',
              models: [{id: modelInput ? modelInput.value : 'gpt-4o-mini', name: modelInput ? modelInput.value : 'GPT-4o Mini'}],
              extra_headers: {}
            });
          } else {
            existing.api_key = keyInput2.value;
            if (endpointInput) existing.api_endpoint = endpointInput.value;
            if (modelInput) { existing.default_model = modelInput.value; existing.models = [{id: modelInput.value, name: modelInput.value}]; }
          }
        }
      });

      window.BlogAPI.saveAIProviders(aiData);
      if (!silent) {
        DashUtils.showFlash('تم حفظ مفاتيح API بنجاح', 'success');
      }
    },

    deletePost: function(id) {
      if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
      var post = window.BlogAPI.deletePost(id);
      if (post) {
        DashUtils.showFlash('تم حذف المقال بنجاح', 'success');
        setTimeout(function() { window.location.reload(); }, 800);
      }
    },

    _toggleEditor: function(mode) {
      var editTab = document.getElementById('editTab');
      var htmlTab = document.getElementById('htmlTab');
      var previewTab = document.getElementById('previewTab');
      var richEditor = document.getElementById('richPostContent');
      var contentArea = document.getElementById('postContent');
      var toolbar = document.getElementById('editorToolbar');
      var previewContent = document.getElementById('previewContent');

      if (!editTab || !htmlTab || !previewTab || !richEditor || !contentArea || !previewContent) return;
      editTab.classList.toggle('active', mode === 'edit');
      htmlTab.classList.toggle('active', mode === 'html');
      previewTab.classList.toggle('active', mode === 'preview');
      previewContent.classList.remove('show');

      if (mode === 'preview') {
        this._syncTextareaFromRichEditor();
        richEditor.style.display = 'none';
        contentArea.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
        previewContent.innerHTML = contentArea.value || '...';
        previewContent.classList.add('show');
      } else if (mode === 'html') {
        this._syncTextareaFromRichEditor();
        richEditor.style.display = 'none';
        contentArea.style.display = 'block';
        if (toolbar) toolbar.style.display = 'none';
        contentArea.focus();
      } else {
        this._syncRichEditorFromTextarea();
        richEditor.style.display = 'block';
        contentArea.style.display = 'none';
        if (toolbar) toolbar.style.display = 'flex';
        richEditor.focus();
      }
      this._updateEditorStats();
    },

    _formatEditor: function(command, value) {
      var rich = document.getElementById('richPostContent');
      if (!rich) return;
      rich.focus();
      document.execCommand(command, false, value || null);
      this._syncTextareaFromRichEditor();
    },

    _insertEditorLink: function() {
      var url = prompt('أدخل رابط الصفحة:', 'https://');
      if (!url) return;
      this._formatEditor('createLink', url);
    },

    _insertEditorImage: function() {
      var url = prompt('أدخل رابط الصورة:', 'https://');
      if (!url) return;
      var alt = prompt('النص البديل للصورة:', '') || '';
      this._insertEditorHtml('<img src="' + this._escHtml(url) + '" alt="' + this._escHtml(alt) + '">');
    },

    _insertEditorTable: function() {
      this._insertEditorHtml('<table><thead><tr><th>العنوان</th><th>العنوان</th></tr></thead><tbody><tr><td>محتوى</td><td>محتوى</td></tr><tr><td>محتوى</td><td>محتوى</td></tr></tbody></table>');
    },

    _insertEditorHtml: function(html) {
      var rich = document.getElementById('richPostContent');
      if (!rich) return;
      rich.focus();
      document.execCommand('insertHTML', false, html);
      this._syncTextareaFromRichEditor();
    },

    _insertTag: function(tag) {
      var map = {
        h2: '<h2>عنوان</h2>',
        h3: '<h3>عنوان فرعي</h3>',
        b: '<strong>نص عريض</strong>',
        i: '<em>نص مائل</em>',
        u: '<u>نص مسطر</u>',
        a: '<a href="https://">رابط</a>',
        img: '<img src="https://" alt="صورة">',
        ul: '<ul><li>عنصر</li><li>عنصر</li></ul>',
        ol: '<ol><li>عنصر</li><li>عنصر</li></ol>',
        blockquote: '<blockquote>نص مقتبس</blockquote>'
      };
      this._insertEditorHtml(map[tag] || '');
    },

    _toDateTimeInput: function(value) {
      if (!value) return window.BlogAPI.toLocalDateTimeValue(new Date());
      value = String(value).replace(/Z$|[+-]\d\d:\d\d$/, '');
      if (value.indexOf('T') === -1) return value + 'T10:00';
      return value.slice(0, 16);
    },

    _safeImageName: function(fileName, baseName) {
      var ext = 'jpg';
      var match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
      if (match && /^(jpg|jpeg|png|webp|gif|avif)$/.test(match[1])) {
        ext = match[1];
      }
      var base = window.BlogAPI.generateSlug(baseName || 'post-image') || 'post-image';
      return base + '.' + ext;
    },

    _escHtml: function(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    window.DashApp.init();
  });
})();
