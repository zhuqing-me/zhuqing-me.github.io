/* darkroom · 站点交互：滚动显影 + 作品区（分类切换 / 按钮翻页 / 鼠标拖动 / 键盘） */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduceMotion ? 'auto' : 'smooth';

  /* ---- 滚动显影 ---- */
  var revealEls = document.querySelectorAll('.io');
  if ('IntersectionObserver' in window && !reduceMotion && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---- 分类标签切换 ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.works-tab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.querySelectorAll('.works-panel').forEach(function (p) {
        var on = p.id === tab.dataset.target;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
        if (on) {
          var strip = p.querySelector('.works-strip');
          if (strip) { strip.scrollLeft = 0; updateStrip(strip); }
        }
      });
    });
  });

  /* ---- 横条画廊 ---- */
  function stepSize(strip) {
    var card = strip.querySelector('.strip-card');
    if (!card) return 320;
    var gap = parseFloat(getComputedStyle(strip).columnGap) || 18;
    return card.getBoundingClientRect().width + gap;
  }

  function updateStrip(strip) {
    var wrap = strip.closest('.works-strip-wrap');
    if (!wrap) return;
    var prev = wrap.querySelector('.strip-prev');
    var next = wrap.querySelector('.strip-next');
    if (!prev || !next) return;
    var max = strip.scrollWidth - strip.clientWidth - 1;
    prev.disabled = strip.scrollLeft <= 1;
    next.disabled = strip.scrollLeft >= max;
  }

  function initStrip(strip) {
    var wrap = strip.closest('.works-strip-wrap');
    if (!wrap) return;
    var prev = wrap.querySelector('.strip-prev');
    var next = wrap.querySelector('.strip-next');
    if (!prev || !next) return;

    function go(dir) {
      strip.scrollBy({ left: dir * stepSize(strip), behavior: behavior });
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    strip.addEventListener('scroll', function () { updateStrip(strip); }, { passive: true });
    window.addEventListener('resize', function () { updateStrip(strip); });

    /* 键盘：聚焦后左右方向键翻动 */
    strip.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    /* 鼠标拖动（触屏走原生滚动） */
    var dragging = false, moved = false, downX = 0, startLeft = 0;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = false;
      downX = e.clientX; startLeft = strip.scrollLeft;
      strip.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - downX;
      if (Math.abs(dx) > 4) moved = true;
      strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      strip.classList.remove('is-dragging');
      if (moved) {
        /* 拖动结束后吸附到最近的卡片 */
        var target = Math.round(strip.scrollLeft / stepSize(strip)) * stepSize(strip);
        strip.scrollTo({ left: target, behavior: behavior });
      }
    });
    /* 拖动后拦截误触点击 */
    strip.addEventListener('click', function (e) {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    }, true);
  }

  document.querySelectorAll('.works-strip').forEach(initStrip);
})();
