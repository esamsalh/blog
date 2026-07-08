(function() {
  function getIdentity() {
    if (typeof netlifyIdentity !== 'undefined') {
      return netlifyIdentity;
    }
    return null;
  }

  window.DashAuth = {
    currentUser: null,
    isAuthenticated: false,

    init: function(callback) {
      if (typeof netlifyIdentity === 'undefined') {
        this._loadIdentityScript(callback);
        return;
      }
      this._setup(callback);
    },

    _loadIdentityScript: function(callback) {
      var script = document.createElement('script');
      script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
      script.async = true;
      script.onload = function() {
        window.DashAuth._setup(callback);
      };
      document.head.appendChild(script);
    },

    _setup: function(callback) {
      var self = this;
      var identity = getIdentity();
      if (!identity) {
        if (callback) callback(null);
        return;
      }

      identity.on('init', function(user) {
        self.currentUser = user;
        self.isAuthenticated = !!user;
        if (callback) callback(user);
      });

      identity.on('login', function(user) {
        self.currentUser = user;
        self.isAuthenticated = true;
        identity.close();
        if (callback) callback(user);
        window.location.reload();
      });

      identity.on('logout', function() {
        self.currentUser = null;
        self.isAuthenticated = false;
        if (callback) callback(null);
        window.location.reload();
      });

      identity.on('error', function(err) {
        console.error('Netlify Identity error:', err);
      });

      try {
        identity.init();
      } catch(e) {
        if (callback) callback(null);
      }
    },

    login: function() {
      var identity = getIdentity();
      if (identity) {
        identity.open('login');
      } else {
        window.location.href = '/.netlify/identity/login';
      }
    },

    logout: function() {
      var identity = getIdentity();
      if (identity) {
        identity.logout();
      } else {
        window.DashAuth.currentUser = null;
        window.DashAuth.isAuthenticated = false;
        window.location.reload();
      }
    },

    getAuthHeaders: function() {
      if (this.currentUser && this.currentUser.token && this.currentUser.token.access_token) {
        return {
          'Authorization': 'Bearer ' + this.currentUser.token.access_token
        };
      }
      return {};
    },

    protect: function() {
      var self = this;
      var currentPage = window.location.pathname;
      if (currentPage.indexOf('/admin/dashboard/') === -1) return;

      this.init(function(user) {
        if (!user) {
          var dashContent = document.getElementById('dashApp');
          if (dashContent) {
            dashContent.innerHTML =
              '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:20px;text-align:center;padding:40px">' +
              '<div style="width:64px;height:64px;background:#6366F1;border-radius:16px;display:flex;align-items:center;justify-content:center">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="32" height="32"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>' +
              '<h2 style="font-size:1.3rem;color:#0F172A">لوحة تحكم المدونة</h2>' +
              '<p style="color:#64748b;max-width:400px">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>' +
              '<button onclick="window.DashAuth.login()" style="padding:12px 32px;background:#6366F1;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit">تسجيل الدخول</button>' +
              '</div>';
          }
        }
      });
    }
  };
})();
