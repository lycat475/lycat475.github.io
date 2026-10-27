/* 站点交互：swup 接管导航 + 换页后重新挂载各类增强
   放成外部脚本而不是内联，是因为 swup 替换 #swup 的 innerHTML 时，
   内联 <script> 不会执行 —— 逻辑必须集中在这里、按 page:view 重跑。 */
(function () {
  'use strict';

  /* ---------- 主题切换：事件委托，换页不丢 ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (err) {}
  });

  /* ---------- 代码块复制按钮（幂等） ---------- */
  function addCopyButtons() {
    document.querySelectorAll('.prose .highlight').forEach(function (box) {
      if (box.querySelector('.copy-btn')) return;
      var pre = box.querySelector('pre');
      if (!pre) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.addEventListener('click', function () {
        var text = pre.innerText;
        var done = function () {
          btn.textContent = '已复制';
          btn.disabled = true;
          setTimeout(function () { btn.textContent = '复制'; btn.disabled = false; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        } else {
          fallback(text, done);
        }
      });
      box.appendChild(btn);
    });
  }

  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- 相册灯箱（按需初始化，换页销毁旧实例） ---------- */
  var lightbox = null;
  function initLightbox() {
    if (lightbox) { lightbox.destroy(); lightbox = null; }
    var gallery = document.querySelector('.plates');
    if (!gallery) return;
    if (!document.querySelector('link[href*="photoswipe.css"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/vendor/photoswipe.css';
      document.head.appendChild(l);
    }
    import('/vendor/photoswipe-lightbox.esm.js').then(function (mod) {
      var PhotoSwipeLightbox = mod.default;
      lightbox = new PhotoSwipeLightbox({
        gallery: '.plates',
        children: 'a.plate-link',
        pswpModule: function () { return import('/vendor/photoswipe.esm.js'); },
        bgOpacity: 0.97,
        showHideAnimationType: 'fade',
        loop: true
      });
      lightbox.init();
    }).catch(function (err) { console.error('lightbox init failed', err); });
  }

  function enhance() {
    addCopyButtons();
    initLightbox();
  }

  /* ---------- 启动 ---------- */
  if (window.Swup) {
    var swup = new window.Swup({
      containers: ['#swup'],
      animateHistoryBrowsing: true,
      skipPopStateHandling: false
    });
    swup.hooks.on('page:view', enhance);
    window.__swup = swup;
  }
  enhance();
})();
