window.BlogAPI = {
  getSettings: function() {
    var cached = localStorage.getItem('dash_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return {
      site_name: 'ToolRar',
      site_url: 'https://toolrar.com',
      blog_title: 'مدونة ToolRar',
      blog_desc: 'أحدث المقالات والأدلة والشروحات الاحترافية حول أدوات الويب',
      github_repo: '',
      github_branch: 'main',
      posts_per_page: 9
    };
  },

  saveSettings: function(settings) {
    localStorage.setItem('dash_settings', JSON.stringify(settings));
  },

  getCategories: function() {
    var cached = localStorage.getItem('dash_categories');
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return fetch('/admin/dashboard/data/categories.json?' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        localStorage.setItem('dash_categories', JSON.stringify(data));
        return data;
      });
  },

  getPosts: function() {
    var cached = localStorage.getItem('dash_posts');
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return [];
  },

  savePosts: function(posts) {
    localStorage.setItem('dash_posts', JSON.stringify(posts));
  },

  addPost: function(post, imageAsset) {
    var posts = this.getPosts();
    post.id = 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    var now = this.toLocalDateTimeValue(new Date());
    post.created_at = post.created_at || now;
    post.updated_at = post.updated_at || post.created_at;
    post.status = post.status || 'published';
    posts.unshift(post);
    this.savePosts(posts);
    this.syncToGitHub(posts, post, imageAsset);
    return post;
  },

  updatePost: function(id, data, imageAsset) {
    var posts = this.getPosts();
    var idx = posts.findIndex(function(p) { return p.id === id; });
    if (idx === -1) return null;
    posts[idx] = Object.assign(posts[idx], data);
    posts[idx].updated_at = data.updated_at || this.toLocalDateTimeValue(new Date());
    this.savePosts(posts);
    this.syncToGitHub(posts, posts[idx], imageAsset);
    return posts[idx];
  },

  deletePost: function(id) {
    var posts = this.getPosts();
    var post = posts.find(function(p) { return p.id === id; });
    posts = posts.filter(function(p) { return p.id !== id; });
    this.savePosts(posts);
    this.syncToGitHub(posts);
    return post;
  },

  getPostById: function(id) {
    var posts = this.getPosts();
    return posts.find(function(p) { return p.id === id; }) || null;
  },

  generateSlug: function(title) {
    return title
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  },

  syncToGitHub: function(posts, post, imageAsset) {
    var settings = this.getSettings();
    if (!settings.github_repo) {
      console.warn('GitHub Repository is not configured in settings');
      return Promise.resolve({ skipped: true, reason: 'GitHub Repository is not configured in settings' });
    }

    var files = [{
      path: 'admin/dashboard/data/posts.json',
      content: JSON.stringify(posts, null, 2)
    }];

    var categoryBuckets = this.buildCategoryPostFiles(posts);
    categoryBuckets.forEach(function(file) {
      files.push(file);
    });

    var listingFiles = this.buildBlogListingFiles(posts);
    listingFiles.forEach(function(file) {
      files.push(file);
    });

    if (post) {
      var postFile = this.generatePostFile(post);
      files.push({
        path: postFile.path,
        content: postFile.content
      });
    }

    if (imageAsset && imageAsset.content && imageAsset.path) {
      files.push({
        path: imageAsset.path,
        content: imageAsset.content,
        encoding: 'base64'
      });
    }

    return this._postGitHubProxy({
      action: 'write-batch',
      owner: settings.github_repo.split('/')[0],
      repo: settings.github_repo.split('/')[1] || '',
      branch: settings.github_branch,
      message: post ? 'Publish blog post: ' + post.title : 'Update blog posts via dashboard',
      files: files
    }).then(function() {
      console.log('GitHub sync successful');
    }).catch(function(err) {
      console.error('GitHub sync failed:', err.message);
    });
  },

  _postGitHubProxy: function(payload) {
    var endpoints = ['/.netlify/functions/github-proxy', '/api/github-proxy'];
    var tryEndpoint = function(index) {
      if (index >= endpoints.length) {
        return Promise.reject(new Error('No GitHub proxy endpoint is available'));
      }
      return fetch(endpoints[index], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res) {
        if (!res.ok) {
          return res.text().then(function(text) {
            if (res.status === 404 && index + 1 < endpoints.length) {
              return tryEndpoint(index + 1);
            }
            throw new Error(text || 'GitHub proxy error ' + res.status);
          });
        }
        return res.json();
      }).catch(function(err) {
        if (index + 1 < endpoints.length) {
          return tryEndpoint(index + 1);
        }
        throw err;
      });
    };
    return tryEndpoint(0);
  },

  buildCategoryPostFiles: function(posts) {
    var self = this;
    var paths = this.getCategoryPathMap(posts);

    return Object.keys(paths).map(function(categoryPath) {
      var categoryPosts = posts.filter(function(item) {
        return self.getCategoryPath(item.category_id) === categoryPath;
      });
      return {
        path: 'blog/' + categoryPath + '/posts.json',
        content: JSON.stringify(categoryPosts, null, 2)
      };
    });
  },

  getCategoryPathMap: function(posts) {
    var self = this;
    var categories = [];
    try { categories = JSON.parse(localStorage.getItem('dash_categories') || '[]'); } catch(e) {}
    var paths = {};

    categories.forEach(function(cat) {
      if (cat && cat.id) paths[self.getCategoryPath(cat.id)] = cat.id;
    });
    (posts || []).forEach(function(post) {
      if (post && post.category_id) paths[self.getCategoryPath(post.category_id)] = post.category_id;
    });
    return paths;
  },

  buildBlogListingFiles: function(posts) {
    var self = this;
    var files = [{ path: 'blog/latest-posts.json', content: JSON.stringify(this.sortPostsByDate(posts).slice(0, 9), null, 2) }];
    var paths = this.getCategoryPathMap(posts);
    Object.keys(paths).forEach(function(categoryPath) {
      var categoryPosts = self.sortPostsByDate(posts.filter(function(item) {
        return self.getCategoryPath(item.category_id) === categoryPath;
      }));
      files.push({
        path: 'blog/' + categoryPath + '/posts.json',
        content: JSON.stringify(categoryPosts, null, 2)
      });
    });
    return files;
  },

  sortPostsByDate: function(posts) {
    return (posts || []).slice().sort(function(a, b) {
      return new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0);
    });
  },

  toLocalDateTimeValue: function(date) {
    date = date || new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  },

  toSchemaDate: function(value, fallback) {
    var raw = value || fallback || this.toLocalDateTimeValue(new Date());
    if (raw.indexOf('T') === -1) raw += 'T10:00';
    if (/Z$|[+-]\d\d:\d\d$/.test(raw)) return raw;
    return raw + ':00+03:00';
  },

  createPostHTML: function(post) {
    var settings = this.getSettings();
    var cats = JSON.parse(localStorage.getItem('dash_categories') || '[]');
    var cat = cats.find(function(c) { return c.id === post.category_id; });
    var catPath = this.getCategoryPath(post.category_id);
    var catName = cat ? cat.name_ar : post.category_id;
    var catColor = cat ? cat.color : '#6366F1';
    var catIcon = cat ? cat.icon : '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>';

    return '<!DOCTYPE html>' +
    '<html lang="ar" dir="rtl">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + post.title + ' - ' + settings.blog_title + '</title>' +
    '<meta name="description" content="' + (post.meta_desc || post.excerpt || '') + '">' +
    '<meta name="keywords" content="' + (post.keywords || '') + '">' +
    '<meta name="author" content="' + (post.author || settings.author_name) + '">' +
    '<link rel="canonical" href="' + settings.site_url + '/blog/' + catPath + '/' + post.slug + '.html">' +
    '<meta property="og:title" content="' + post.title + '">' +
    '<meta property="og:description" content="' + (post.meta_desc || post.excerpt || '') + '">' +
    '<meta property="og:image" content="' + (post.image ? settings.site_url + '/blog/' + catPath + '/img/' + post.image : '') + '">' +
    '<meta property="og:url" content="' + settings.site_url + '/blog/' + catPath + '/' + post.slug + '.html">' +
    '<meta property="og:type" content="article">' +
    '<script type="application/ld+json">' +
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.meta_desc || post.excerpt || '',
      "url": settings.site_url + '/blog/' + catPath + '/' + post.slug + '.html',
      "datePublished": this.toSchemaDate(post.created_at),
      "dateModified": this.toSchemaDate(post.updated_at, post.created_at),
      "author": { "@type": "Person", "name": post.author || settings.author_name },
      "publisher": { "@type": "Organization", "name": settings.site_name, "url": settings.site_url },
      "mainEntityOfPage": { "@type": "WebPage", "@id": settings.site_url + '/blog/' + catPath + '/' + post.slug + '.html' },
      "image": post.image ? settings.site_url + '/blog/' + catPath + '/img/' + post.image : ''
    }) +
    '</script>' +
    '<script type="application/ld+json">' +
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": settings.site_url + '/' },
        { "@type": "ListItem", "position": 2, "name": "المدونة", "item": settings.site_url + '/blog/' },
        { "@type": "ListItem", "position": 3, "name": catName, "item": settings.site_url + '/blog/' + catPath + '/' },
        { "@type": "ListItem", "position": 4, "name": post.title }
      ]
    }) +
    '</script>' +
    '<link rel="stylesheet" href="../../../admin/assets/css/fonts-cairo.css">' +
    '<style>' +
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}' +
    'html{scroll-behavior:smooth}' +
    'body{font-family:\'Cairo\',sans-serif;min-height:100vh;display:flex;flex-direction:column;background:#fff;color:#1e293b;line-height:1.8}' +
    '.dark body{background:#080C1A;color:#e2e8f0}' +
    '.dark .header,.dark .article-header,.dark .footer{background:#080C1A}' +
    '.dark .article-section{background:#0F172A}' +
    '.dark .article-content h2,.dark .article-content h3{color:#e2e8f0}' +
    '.dark .article-content p,.dark .article-content li{color:#cbd5e1}' +
    '.dark .author-box,.dark .related-card,.dark .sidebar-card{background:#1E293B;border-color:#334155}' +
    '.container{max-width:1280px;margin:0 auto;padding:0 1rem}' +
    '@media(min-width:640px){.container{padding:0 1.5rem}}' +
    '@media(min-width:1024px){.container{padding:0 2rem}}' +
    '.header{background:#0F172A;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(255,255,255,.05)}' +
    '.header-inner{display:flex;align-items:center;justify-content:space-between;height:64px}' +
    '.logo{display:flex;align-items:center;gap:10px;text-decoration:none}' +
    '.logo-icon{width:36px;height:36px;background:#6366F1;border-radius:8px;display:flex;align-items:center;justify-content:center}' +
    '.logo-icon svg{width:20px;height:20px;color:#fff}' +
    '.logo-text{color:#fff;font-weight:700;font-size:1.5rem}' +
    '.desktop-nav{display:none;align-items:center;flex:1}' +
    '@media(min-width:1024px){.desktop-nav{display:flex}}' +
    '.nav-links-center{display:flex;align-items:center;gap:2px;flex:1;justify-content:center}' +
    '.nav-link{color:#fff;text-decoration:none;padding:8px 10px;font-size:.875rem;font-weight:500;display:flex;align-items:center;gap:4px}' +
    '.nav-link:hover{color:#d1d5db}' +
    '.nav-link.active{color:#6366F1}' +
    '.article-header{background:#0F172A;padding:48px 0 40px;text-align:center}' +
    '.article-header h1{font-size:1.6rem;font-weight:900;color:#fff;margin-bottom:16px;max-width:800px;margin:0 auto 16px}' +
    '.article-meta{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-size:.78rem;color:#94a3b8}' +
    '.article-section{background:#F8FAFC;flex:1}' +
    '.article-body{padding:40px 1rem;max-width:800px;margin:0 auto}' +
    '.article-content h2{font-size:1.35rem;font-weight:800;color:#111827;margin-top:36px;margin-bottom:14px;border-bottom:2px solid #6366F1;display:inline-block}' +
    '.article-content h3{font-size:1.1rem;font-weight:700;color:#1e293b;margin-top:28px;margin-bottom:10px}' +
    '.article-content p{margin-bottom:18px;text-align:justify}' +
    '.article-content ul,.article-content ol{margin-right:24px;margin-bottom:18px}' +
    '.article-content li{margin-bottom:8px}' +
    '.article-content a{color:#6366F1;text-decoration:underline}' +
    '.article-content blockquote{border-right:4px solid #6366F1;background:#F1F5F9;padding:16px 20px;margin:24px 0;border-radius:0 12px 12px 0}' +
    '.article-content img{max-width:100%;height:auto;border-radius:12px;margin:24px 0}' +
    '.featured-image-wrap img{width:100%;aspect-ratio:1200/630;object-fit:cover;border-radius:14px}' +
    '.author-box{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:20px;margin:40px 0 32px}' +
    '.author-avatar{width:56px;height:56px;border-radius:50%;background:#6366F1;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;font-weight:700}' +
    '.footer{background:#0F172A;margin-top:auto}' +
    '.footer-inner{padding:40px 1rem;text-align:center}' +
    '.footer p{color:#6b7280;font-size:.875rem}' +
    '.dark-toggle,.mobile-controls,.dropdown-wrap,.mobile-menu{display:none}' +
    '@media(max-width:639px){.article-header h1{font-size:1.3rem}}' +
    '</style>' +
    '<link rel="icon" href="../../../admin/assets/favicon-32.png">' +
    '</head>' +
    '<body>' +
    '<header class="header"><div class="container"><div class="header-inner">' +
    '<a href="../../../index.html" class="logo"><div class="logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div><span class="logo-text">' + settings.site_name + '</span></a>' +
    '<nav class="desktop-nav"><div class="nav-links-center">' +
    '<a href="../../../index.html" class="nav-link">الرئيسية</a>' +
    '<a href="../../../all-tools.html" class="nav-link">جميع الأدوات</a>' +
    '<a href="../../index.html" class="nav-link active">المدونة</a>' +
    '</div></nav></div></div></header>' +
    '<article>' +
    '<header class="article-header"><div class="container"><h1>' + post.title + '</h1>' +
    '<div class="article-meta">' +
    '<span>' + post.created_at + '</span>' +
    '<span>' + (post.author || settings.author_name) + '</span>' +
    '<span>' + (post.read_time || '5') + ' دقائق</span>' +
    '<span style="background:' + catColor + '22;color:' + catColor + ';padding:4px 12px;border-radius:9999px;font-weight:600;font-size:.7rem">' + catName + '</span>' +
    '</div></div></header>' +
    '<section class="article-section"><div class="container"><div class="article-body">' +
    (post.image ? '<div class="featured-image-wrap"><img src="img/' + post.image + '" alt="' + (post.image_alt || post.title) + '" width="1200" height="630" loading="lazy"></div>' : '') +
    '<div class="article-content">' + (post.content || '') + '</div>' +
    '<div class="author-box"><div class="author-avatar">' + (post.author || settings.author_name).charAt(0) + '</div><div><h4>' + (post.author || settings.author_name) + '</h4><p>' + (settings.author_bio || '') + '</p></div></div>' +
    '</div></div></section>' +
    '</article>' +
    '<footer class="footer"><div class="container"><div class="footer-inner"><p>' + settings.site_name + ' &copy; ' + new Date().getFullYear() + ' جميع الحقوق محفوظة</p></div></div></footer>' +
    '<script>' +
    '(function(){var t=localStorage.getItem("toolrar-theme");if(t==="dark"){document.documentElement.classList.add("dark")}})();' +
    '</script>' +
    '</body></html>';
  },

  generatePostFile: function(post) {
    var html = this.createPostHTML(post);
    var slug = post.slug || this.generateSlug(post.title);
    return {
      path: 'blog/' + this.getCategoryPath(post.category_id) + '/' + slug + '.html',
      content: html
    };
  },

  getCategoryPath: function(categoryId) {
    var map = {
      'text-tools': 'text-tools',
      'Developer': 'developer-tools',
      'developer-tools': 'developer-tools',
      'Photo-Editing': 'photo-design-tools',
      'photo-design-tools': 'photo-design-tools',
      'Calculators': 'calculator-tools',
      'calculator-tools': 'calculator-tools',
      'docs-tools': 'pdf-tools',
      'pdf-tools': 'pdf-tools',
      'zip-tools': 'zip-tools',
      'seo': 'seo-tools',
      'seo-tools': 'seo-tools',
      'General': 'general-tools',
      'general-tools': 'general-tools',
      'Social-media': 'social-media-tools',
      'social-media-tools': 'social-media-tools'
    };
    return map[categoryId] || this.generateSlug(categoryId || 'general-tools');
  },

  // ===== AI Provider Management =====
  getAIProviders: function() {
    var cached = localStorage.getItem('dash_ai_providers');
    var defaults = window.DashApp && window.DashApp._getDefaultAIProviders ? window.DashApp._getDefaultAIProviders() : (window.AI_PROVIDERS_DATA || null);
    if (cached) {
      try {
        var data = JSON.parse(cached);
        if (defaults && defaults.providers) {
          data = this.mergeAIProviders(defaults, data);
          localStorage.setItem('dash_ai_providers', JSON.stringify(data));
        }
        return data;
      } catch(e) {}
    }
    if (window.AI_PROVIDERS_DATA) {
      var mergedWindow = defaults && defaults.providers
        ? this.mergeAIProviders(defaults, window.AI_PROVIDERS_DATA)
        : window.AI_PROVIDERS_DATA;
      localStorage.setItem('dash_ai_providers', JSON.stringify(mergedWindow));
      return mergedWindow;
    }
    return this._fetchJSON('/admin/dashboard/data/ai-providers.json');
  },

  _fetchJSON: function(url) {
    return fetch(url + '?' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        return data;
      });
  },

  _postAIProxy: function(payload, customEndpoints) {
    var endpoints = customEndpoints || ['/.netlify/functions/ai-proxy', '/api/ai-proxy'];
    var tryEndpoint = function(index) {
      if (index >= endpoints.length) {
        return Promise.reject(new Error('No AI proxy endpoint is available'));
      }
      return fetch(endpoints[index], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res) {
        if (!res.ok) {
          return res.text().then(function(text) {
            if (res.status === 404 && index + 1 < endpoints.length) {
              return tryEndpoint(index + 1);
            }
            throw new Error(BlogAPI._formatAIError(text, 'AI proxy error ' + res.status));
          });
        }
        return res.json().then(function(data) {
          if (data && data.error) {
            throw new Error(typeof data.error === 'string' ? data.error : (data.error.message || 'AI proxy error'));
          }
          return data;
        });
      }).catch(function(err) {
        if (index + 1 < endpoints.length) {
          return tryEndpoint(index + 1);
        }
        throw err;
      });
    };
    return tryEndpoint(0);
  },

  _postAIDirect: function(payload) {
    return fetch(payload.url, {
      method: payload.method || 'POST',
      headers: payload.headers || { 'Content-Type': 'application/json' },
      body: payload.body || ''
    }).then(function(res) {
      return res.text().then(function(text) {
        var data;
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
        if (!res.ok) {
          throw new Error(BlogAPI._formatAIError(text, 'AI API error ' + res.status));
        }
        return data;
      });
    });
  },

  _postAIRequest: function(payload) {
    if (window.location && window.location.protocol === 'file:') {
      var localProxyEndpoints = [
        'http://localhost:8888/.netlify/functions/ai-proxy',
        'http://127.0.0.1:8888/.netlify/functions/ai-proxy',
        'http://localhost:8788/api/ai-proxy',
        'http://127.0.0.1:8788/api/ai-proxy'
      ];
      return this._postAIProxy(payload, localProxyEndpoints).catch(function(proxyErr) {
        return BlogAPI._postAIDirect(payload).catch(function(directErr) {
          if (/Failed to fetch|NetworkError|Load failed/i.test(directErr.message || '')) {
            throw new Error('لا يمكن الاتصال بمزود الذكاء الاصطناعي من رابط file:// مباشرة بسبب قيود المتصفح. افتح الصفحة من رابط Netlify أو Cloudflare Pages، أو شغّل Netlify Dev على المنفذ 8888 / Wrangler Pages على المنفذ 8788 ثم جرّب الزر مرة أخرى. آخر خطأ: ' + proxyErr.message);
          }
          throw directErr;
        });
      });
    }
    return this._postAIProxy(payload).catch(function(proxyErr) {
      return BlogAPI._postAIDirect(payload).catch(function() {
        throw proxyErr;
      });
    });
  },

  _formatAIError: function(text, fallback) {
    if (!text) return fallback;
    try {
      var data = JSON.parse(text);
      if (data.error && data.error.message) return data.error.message;
      if (data.error && typeof data.error === 'string') return data.error;
      if (data.message) return data.message;
    } catch (e) {}
    return text || fallback;
  },

  _extractAIText: function(data, isGoogle) {
    if (isGoogle) {
      return data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
        ? data.candidates[0].content.parts[0].text || ''
        : '';
    }
    if (data && data.choices && data.choices[0]) {
      var choice = data.choices[0];
      if (choice.message) return choice.message.content || choice.message.reasoning_content || '';
      if (choice.text) return choice.text;
      if (choice.delta) return choice.delta.content || '';
    }
    if (data && data.output_text) return data.output_text;
    if (data && data.content) return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    if (data && data.raw) return data.raw;
    return '';
  },

  saveAIProviders: function(data) {
    localStorage.setItem('dash_ai_providers', JSON.stringify(data));
  },

  mergeAIProviders: function(defaults, saved) {
    defaults = defaults || { providers: [] };
    saved = saved || {};
    var merged = JSON.parse(JSON.stringify(defaults));
    var savedProviders = saved.providers || [];

    savedProviders.forEach(function(savedProvider) {
      var idx = merged.providers.findIndex(function(p) { return p.id === savedProvider.id; });
      if (idx === -1) {
        merged.providers.push(savedProvider);
        return;
      }

      var base = merged.providers[idx];
      var savedModels = savedProvider.models || [];
      var modelMap = {};
      (base.models || []).forEach(function(model) { modelMap[model.id] = model; });
      savedModels.forEach(function(model) { modelMap[model.id] = model; });

      merged.providers[idx] = Object.assign({}, base, savedProvider, {
        api_key: savedProvider.api_key || base.api_key || '',
        default_model: savedProvider.default_model || base.default_model || '',
        models: Object.keys(modelMap).map(function(id) { return modelMap[id]; }),
        extra_headers: Object.assign({}, base.extra_headers || {}, savedProvider.extra_headers || {})
      });
    });

    merged.selected_provider = saved.selected_provider || defaults.selected_provider || 'openrouter';
    merged.selected_model = saved.selected_model || defaults.selected_model || '';
    merged.selected_lang = saved.selected_lang || defaults.selected_lang || 'ar';
    return merged;
  },

  getProviderById: function(providerId) {
    var data = this.getAIProviders();
    if (!data || !data.providers) return null;
    return data.providers.find(function(p) { return p.id === providerId; }) || null;
  },

  getModelsForProvider: function(providerId) {
    var provider = this.getProviderById(providerId);
    return provider ? provider.models : [];
  },

  callAI: function(providerId, modelId, systemPrompt, userPrompt, maxTokens) {
    var providersData = this.getAIProviders();
    if (!providersData || !providersData.providers) {
      return Promise.reject(new Error('لم يتم تحميل بيانات مزودي الخدمة'));
    }
    var provider = providersData.providers.find(function(p) { return p.id === providerId; });
    if (!provider) {
      return Promise.reject(new Error('مزود الخدمة غير موجود: ' + providerId));
    }
    var apiKey = provider.api_key || '';
    if (!apiKey) {
      return Promise.reject(new Error('مفتاح API غير مضبوط لمزود الخدمة: ' + provider.name_ar + '. يرجى ضبطه في الإعدادات.'));
    }
    var model = modelId || provider.default_model || 'deepseek/deepseek-v4-flash:free';
    maxTokens = maxTokens || 4096;

    var isGoogle = providerId === 'google';
    var url = isGoogle
      ? 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      : provider.api_endpoint;
    var headers = isGoogle
      ? { 'Content-Type': 'application/json' }
      : (function() {
          var h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
          if (provider.extra_headers) {
            for (var key in provider.extra_headers) {
              if (provider.extra_headers.hasOwnProperty(key)) {
                h[key] = provider.extra_headers[key];
              }
            }
          }
          return h;
        })();
    var payload = isGoogle
      ? JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: Math.max(maxTokens, 8192) }
        })
      : JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: Math.max(maxTokens, 8192),
          temperature: 0.7,
          stream: false
        });

    return this._postAIRequest({
      url: url,
      method: 'POST',
      headers: headers,
      body: payload
    }).then(function(data) {
      var text = BlogAPI._extractAIText(data, isGoogle);
      text = text.replace(/^```(?:json)?\s*\n?/i, '');
      text = text.replace(/\n?```\s*$/i, '');
      if (!text.trim()) {
        throw new Error('لم يرجع النموذج أي نص. جرّب نموذجاً آخر أو تحقق من إعدادات المزود.');
      }
      return text;
    });
  }
};