/* 站点交互：swup 接管导航 + 换页后重新挂载各类增强
   放成外部脚本而不是内联，是因为 swup 替换 #swup 的 innerHTML 时，
   内联 <script> 不会执行 —— 逻辑必须集中在这里、按 page:view 重跑。 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 动效开关 ----------
     哪一条不顺眼，把对应值改成 false 即可（不用删代码）。
     注意：报头入场 / 滚动显影的 CSS 半边由 <html class="js-motion">
     统一关闭（head.html 里那行首屏脚本），这里只管 JS 这一半。 */
  var MOTION = {
    masthead: true,     // 报头入场 + 滚动视差
    stickyHead: true,   // 页头吸附 + 毛玻璃
    reveal: true,       // 相册 / 列表滚动显影
    progress: true,     // 文章页阅读进度线
    imageFade: true,    // 图片载入渐显
    zoomLightbox: true  // 灯箱从缩略图放大开合
  };
  function motion(flag) { return !!MOTION[flag] && !reduce; }

  /* ---------- 主题切换：从按钮扩散的圆形揭示（View Transition） ---------- */
  function applyTheme(next) {
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (err) {}
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.theme-toggle') : null;
    // 圆形揭示的过渡快照层会吃掉点击（第二次点时 e.target 变成 <html>，CSS 的
    // pointer-events 也管不到它）：坐标落在按钮上就照常切换，连点不会丢一次。
    if (!btn && e.target === document.documentElement && document.documentElement.classList.contains('theme-vt')) {
      var t = document.querySelector('.theme-toggle');
      if (t) {
        var br = t.getBoundingClientRect();
        if (e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom) btn = t;
      }
    }
    if (!btn) return;
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || reduce) {
      applyTheme(next);
      return;
    }

    // 圆心 = 按钮中心；半径 = 到视口最远角的距离
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', Math.ceil(far) + 'px');

    root.classList.add('theme-vt');
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.finished.finally(function () {
      root.classList.remove('theme-vt');
    });
  });

  /* ---------- 滚动效果：一条 rAF 循环，先读完再写 ---------- */
  var scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(applyScroll);
  }
  function applyScroll() {
    scrollQueued = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    /* ---- 读 ---- */
    var mast = motion('masthead') ? document.querySelector('.masthead') : null;
    var mastP = 0;
    if (mast) {
      var mr = mast.getBoundingClientRect();
      // 用「已经滚过的距离 / 报头高度」，不是「报头离开视口的距离」：
      // 首页很短（1440×900 只能滚 78px，正好等于页头高），按后者算永远是 0，视差等于没开。
      mastP = Math.min(Math.max(y / ((mr.height || 1) * 0.62), 0), 1);
    }
    var post = motion('progress') ? document.querySelector('.post') : null;
    var postP = 0;
    if (post) {
      var pr = post.getBoundingClientRect();
      var total = pr.height - window.innerHeight;
      postP = total > 8 ? Math.min(Math.max(-pr.top / total, 0), 1) : 0;
    }
    var head = motion('stickyHead') ? document.querySelector('.site-head') : null;

    /* ---- 写 ---- */
    if (mast) {
      var media = mast.querySelector('.masthead-media');
      var text = mast.querySelector('.masthead-text');
      if (media) media.style.setProperty('--mast-scale', (1 + mastP * 0.055).toFixed(4));
      if (text) {
        text.style.setProperty('--mast-text-y', (-mastP * 34).toFixed(1) + 'px');
        text.style.setProperty('--mast-text-o', (1 - mastP * 0.9).toFixed(3));
      }
    }
    if (head) {
      var stuck = y > 6;
      head.classList.toggle('is-stuck', stuck);
      if (headGlass) headGlass.classList.toggle('is-on', stuck);
    }
    if (post) paintProgress(postP);
  }

  /* ---------- 页头毛玻璃：满幅固定条，高度跟页头一致 ---------- */
  var headGlass = null;
  function ensureHeadGlass() {
    var head = motion('stickyHead') ? document.querySelector('.site-head') : null;
    if (!head) {
      if (headGlass && headGlass.parentNode) headGlass.parentNode.removeChild(headGlass);
      headGlass = null;
      return;
    }
    if (!headGlass || !headGlass.parentNode) {
      headGlass = document.createElement('div');
      headGlass.className = 'head-glass';
      headGlass.setAttribute('aria-hidden', 'true');
      document.body.appendChild(headGlass);
    }
    headGlass.style.height = Math.round(head.getBoundingClientRect().height) + 'px';
    // 页头高度也写给 CSS：锚点跳转 / 跳到正文时的 scroll-padding-top 用它，别让吸附页头盖住目标
    document.documentElement.style.setProperty('--head-h', Math.round(head.getBoundingClientRect().height) + 'px');
  }

  /* 页头自己变高变矮（窄屏换行、浏览器字号放大、字体加载完）时也跟着重量一次，
     只靠 window resize 会漏掉这些情况，玻璃条就会比页头短一截 */
  var headRO = null;
  function watchHead() {
    if (!window.ResizeObserver) return;
    var head = document.querySelector('.site-head');
    if (headRO) headRO.disconnect();
    if (!head) { headRO = null; return; }
    headRO = new ResizeObserver(function () { ensureHeadGlass(); });
    headRO.observe(head);
  }

  /* ---------- 文章页阅读进度线 ---------- */
  var readBar = null;
  function ensureProgressBar() {
    if (!motion('progress') || !document.querySelector('.post')) {
      if (readBar && readBar.parentNode) readBar.parentNode.removeChild(readBar);
      readBar = null;
      return;
    }
    if (readBar && readBar.parentNode) return;
    readBar = document.createElement('div');
    readBar.className = 'read-progress';
    readBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(readBar);
  }
  function paintProgress(p) {
    if (!readBar) return;
    readBar.style.setProperty('--rp', p.toFixed(4));
    readBar.classList.toggle('is-on', p > 0.004 && p < 0.997);
  }

  /* ---------- 滚动显影（IntersectionObserver；无 JS 时完全不动） ---------- */
  var io = null;
  function initReveal() {
    if (io) { io.disconnect(); io = null; }
    if (!motion('reveal') || !('IntersectionObserver' in window)) return;
    var nodes = document.querySelectorAll('.gallery .plate, .index-row, .archive-row');
    if (!nodes.length) return;

    io = new IntersectionObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (!list[i].isIntersecting) continue;
        list[i].target.classList.add('is-in');
        io.unobserve(list[i].target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

    Array.prototype.forEach.call(nodes, function (el) {
      if (el.classList.contains('is-in')) return;
      el.classList.add('reveal');
      // 相册是 CSS 分栏排的，DOM 顺序 ≠ 视觉顺序 → 不排延迟；
      // 单列列表按行号错峰，最多 8 档
      if (!el.closest('.gallery')) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty('--i', String(Math.min(i, 8)));
      }
      io.observe(el);
    });
  }

  /* ---------- 图片载入渐显（已缓存的图不参与，避免闪一下） ---------- */
  function initImageFade() {
    if (!motion('imageFade')) return;
    document.querySelectorAll('.plate img, .post img').forEach(function (img) {
      if (img.dataset.fadeReady) return;
      img.dataset.fadeReady = '1';
      if (img.complete && img.naturalWidth) return;   // 已经画出来了，别动
      img.classList.add('is-loading');
      var done = function () { img.classList.remove('is-loading'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

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
        // 从缩略图位置放大展开 / 收回（减弱动效时退回淡入）
        showHideAnimationType: motion('zoomLightbox') ? 'zoom' : 'fade',
        loop: true
      });
      lightbox.init();
    }).catch(function (err) { console.error('lightbox init failed', err); });
  }

  /* ---------- 同步 <head> 里的 meta（swup 只更新 title） ---------- */
  function syncHead(visit) {
    try {
      var doc = visit && visit.to && visit.to.document;
      if (!doc) return;
      [['meta[name="description"]', 'content'],
       ['meta[property="og:title"]', 'content'],
       ['meta[property="og:description"]', 'content']].forEach(function (pair) {
        var next = doc.querySelector(pair[0]);
        var cur = document.querySelector(pair[0]);
        if (next && cur) cur.setAttribute(pair[1], next.getAttribute(pair[1]) || '');
      });
    } catch (e) { /* 失败不影响导航 */ }
  }

  /* 当前栏目下划线：header 在 #swup 之外、不随换页重建，得自己标 */
  function markNav() {
    var here = location.pathname;
    if (here.slice(-1) !== '/') here += '/';
    var links = document.querySelectorAll('.site-nav a[href]');
    for (var i = 0; i < links.length; i++) {
      var p = links[i].pathname || '';
      if (p.slice(-1) !== '/') p += '/';
      if (p === here) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');
    }
  }

  /* 宽窄版式跟着换页走：模板里首页/相册是宽栏（body.wide），文章/关于是窄栏。
     swup 只替换 #swup 里面的内容，不会更新 <body> 的属性，所以从首页点进文章
     还是宽栏，一刷新才变窄（反过来，文章点相册会被挤窄）。标记放在 main[data-wide]
     —— 它是被替换的内容的一部分，换完读一眼就知道该宽还是该窄。 */
  function syncBodyClass() {
    var main = document.getElementById('main');
    document.body.classList.toggle('wide', !!(main && main.hasAttribute('data-wide')));
  }
  document.addEventListener('swup:content:replace', syncBodyClass);

  function enhance() {
    syncBodyClass();
    addCopyButtons();
    initLightbox();
    ensureHeadGlass();
    watchHead();
    ensureProgressBar();
    initReveal();
    initImageFade();
    markNav();
    onScroll();          // 立即按当前滚动位置摆好视差/吸附/进度
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { ensureHeadGlass(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ensureHeadGlass);

  if (window.Swup) {
    var plugins = [];
    if (window.SwupPreloadPlugin) {
      plugins.push(new window.SwupPreloadPlugin({
        preloadHoveredLinks: true,
        preloadVisibleLinks: { enabled: false }   // 不在首屏就预取全部链接
      }));
    }
    if (window.SwupScrollPlugin) {
      plugins.push(new window.SwupScrollPlugin({ offset: 0 }));
    }
    if (window.SwupProgressPlugin) {
      plugins.push(new window.SwupProgressPlugin({ delay: 150 }));
    }
    var swup = new window.Swup({
      containers: ['#swup'],
      animateHistoryBrowsing: true,
      plugins: plugins
    });
    swup.hooks.on('page:view', function (visit) {
      syncHead(visit);
      enhance();
      // 滚动恢复可能发生在 page:view 之后，下一帧再对齐一次
      requestAnimationFrame(onScroll);
    });
    window.__swup = swup;
  }
  enhance();
})();
