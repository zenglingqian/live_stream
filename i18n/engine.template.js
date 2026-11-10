/* Language layer for 今晚去哪播？ — dictionary keyed by the source Simplified-Chinese text run.
   zh-CN is the authored language (no dictionary); the others map source text -> translation. */
(function () {
  'use strict';

  var D = {/*LOCALES*/};

  /* Units, UI labels and short forms owned by this layer (always win over the dictionaries). */
  var SUPP = {
    'zh-TW': {
      '界面语言': '介面語言', '亿': '億', ' 亿': ' 億', '亿+': '億+', '万': '萬', ' 类第一': ' 類首位',
      '今晚去哪播？': '今晚去哪播？', '元/笔': '元/筆', '/笔': '/筆', '元': '元'
    },
    'en': {
      '界面语言': 'Interface language', '亿': 'B', ' 亿': 'B', '亿+': 'B+', '万': '10k', '类': ' categories',
      ' 类第一': ' first-place categories', '今晚去哪播？': 'Where to stream tonight?', '/笔': ' per order', '元/笔': 'RMB / order', '元': 'RMB'
    },
    'ja': {
      '界面语言': '表示言語', '亿': '億', ' 亿': ' 億', '亿+': '億+', '万': '万',
      ' 类第一': ' カテゴリで首位', '今晚去哪播？': '今夜、どこで配信？', '/笔': '/件', '元/笔': '元/件', '元': '元'
    },
    'ru': {
      '界面语言': 'Язык интерфейса', '亿': '', ' 亿': '', '亿+': '', '万': '10 тыс.',
      '月活用户规模 (亿)': 'Аудитория MAU',
      ' 类第一': ' — первое место', '今晚去哪播？': 'Где стримить этим вечером?', '/笔': ' за заказ', '元/笔': 'юаней за заказ', '元': 'юаней'
    }
  };

  var TITLES = {
    'zh-CN': '今晚去哪播？ · 抖音 / 虎牙 / 微信视频号 / 小红书',
    'zh-TW': '今晚去哪播？ · 抖音 / 虎牙 / 微信視頻號 / 小紅書',
    'en': 'Where to stream tonight? · Douyin / Huya / WeChat Channels / RED',
    'ja': '今夜どこで配信？ · Douyin / Huya / WeChat Channels / 小紅書',
    'ru': 'Где стримить? · Douyin / Huya / WeChat Channels / RED'
  };

  var DESCS = {
    'zh-CN': '2026年直播平台选型：去哪播最赚？抖音、虎牙、微信视频号、小红书四平台全维度对比与35类直播适配排序',
    'zh-TW': '2026年直播平台選型：去哪播最賺？抖音、虎牙、微信視頻號、小紅書四平台全維度對比與35類直播適配排序',
    'en': '2026 live-streaming platform guide: Douyin, Huya, WeChat Channels and RED compared across four dimensions, with all 35 livestream categories ranked',
    'ja': '2026年ライブ配信プラットフォーム選び：Douyin・Huya・WeChat Channels・小紅書を4つの軸で比較し、35カテゴリの適合度を順位付け',
    'ru': 'Выбор площадки для стриминга в 2026 году: Douyin, Huya, WeChat Channels и RED — сравнение по четырём параметрам и рейтинг 35 форматов трансляций'
  };

  var BRAND = { 'zh-CN': '今晚去哪播？', 'zh-TW': '今晚去哪播？', 'en': 'Where to stream?', 'ja': '今夜どこ配信？', 'ru': 'Где стримить?' };

  var HEAD = {
    'zh-CN': '今晚去哪播？', 'zh-TW': '今晚去哪播？',
    'en': 'Where to stream tonight?', 'ja': '今夜、どこで配信？', 'ru': 'Где стримить этим вечером?'
  };

  var LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ru'];
  var CODE = { 'zh-CN': '中', 'zh-TW': '繁', 'en': 'EN', 'ja': '日', 'ru': 'RU' };
  var FONT_LANG = {
    'ja': '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "PingFang SC", "Microsoft YaHei", sans-serif',
    'ru': '"SF Pro Text", "Helvetica Neue", "Segoe UI", Arial, "PingFang SC", sans-serif'
  };

  var lang = 'zh-CN';
  var dict = {};
  var artOriginal = null;

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  function T(s) {
    if (typeof s !== 'string' || !s) return s;
    var v = dict[norm(s)];
    return v === undefined ? s : v;
  }

  function setDict(id) {
    lang = id;
    dict = id === 'zh-CN' ? {} : Object.assign({}, D[id] || {}, SUPP[id] || {});
  }

  /* Number units: value arrives in 亿 (100 million). */
  function yi(v) {
    var n = Number(v);
    if (isNaN(n)) return String(v);
    if (lang === 'zh-CN' || lang === 'zh-TW' || lang === 'ja') return n + (lang === 'zh-TW' ? '億' : lang === 'ja' ? '億' : '亿');
    var m = n * 100;
    if (lang === 'ru') {
      if (m >= 1000) return trim(m / 1000) + ' млрд';
      return trim(m) + ' млн';
    }
    if (m >= 1000) return trim(m / 1000) + 'B';
    return trim(m) + 'M';
  }
  function trim(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }

  /* Pristine source text is cached per node/attribute so switching is always
     derived from the authored Chinese, never from the previous translation. */
  var SRC = typeof WeakMap === 'function' ? new WeakMap() : null;
  var ASRC = typeof WeakMap === 'function' ? new WeakMap() : null;

  function walkText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return 2;
        if (/^(script|style|noscript|textarea)$/i.test(p.tagName)) return 2;
        if (p.closest('[data-no-i18n]')) return 2;
        return node.nodeValue && node.nodeValue.trim() ? 1 : 2;
      }
    });
    var node, raw, lead, trail, key, val;
    while (walker.nextNode()) {
      node = walker.currentNode;
      if (SRC && !SRC.has(node)) SRC.set(node, node.nodeValue);
      raw = SRC ? SRC.get(node) : node.nodeValue;
      var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
      if (!m || !m[2]) continue;
      lead = m[1]; trail = m[3]; key = norm(m[2]);
      val = dict[key];
      val = (lang === 'zh-CN' || typeof val !== 'string') ? raw : lead + val + trail;
      if (node.nodeValue !== val) node.nodeValue = val;
    }
  }

  function origText(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var out = '', node;
    while (w.nextNode()) {
      node = w.currentNode;
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      out += SRC && SRC.has(node) ? SRC.get(node) : node.nodeValue;
    }
    return norm(out);
  }

  function walkAttrs() {
    var nodes = document.querySelectorAll('[aria-label], [title]');
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest('#dotnav')) return;          /* dot titles come from refreshDots */
      if (el.closest('[data-no-i18n]')) return;
      var store = ASRC && ASRC.get(el);
      if (!store) { store = {}; if (ASRC) ASRC.set(el, store); }
      ['aria-label', 'title'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (!v) return;
        if (!(a in store)) store[a] = v;
        var orig = store[a];
        var t = lang === 'zh-CN' ? orig : dict[norm(orig)];
        var next = typeof t === 'string' ? t : orig;
        if (v !== next) el.setAttribute(a, next);
      });
    });
  }

  var baseChartFont = null;

  function relabelCharts() {
    if (!window.Chart || !Chart.instances) return;
    if (Chart.defaults && Chart.defaults.font) {
      if (baseChartFont === null) baseChartFont = Chart.defaults.font.family;
      Chart.defaults.font.family = FONT_LANG[lang] || baseChartFont;
    }
    Object.keys(Chart.instances).forEach(function (k) {
      var ch = Chart.instances[k];
      if (!ch || !ch.data) return;
      if (!ch.__src) {
        ch.__src = {
          labels: Array.isArray(ch.data.labels) ? ch.data.labels.slice() : null,
          ds: (ch.data.datasets || []).map(function (d) { return d.label; })
        };
      }
      if (ch.__src.labels) ch.data.labels = ch.__src.labels.map(T);
      (ch.data.datasets || []).forEach(function (d, i) { d.label = T(ch.__src.ds[i]); });
      if (ch.update) ch.update('none');
    });
  }

  function ruPlural(n, one, few, many) {
    n = Math.abs(n) % 100;
    if (n > 10 && n < 20) return many;
    n = n % 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  /* "18<small>类</small>" pairs a number with its unit, so the unit needs a
     count-aware form in Russian and English. */
  function fixUnits() {
    var smalls = document.querySelectorAll('.stat-value small');
    Array.prototype.forEach.call(smalls, function (s) {
      var n = parseInt(s.parentNode.textContent, 10);
      if (isNaN(n)) return;
      var unit;
      if (lang === 'ru') unit = ruPlural(n, ' категория', ' категории', ' категорий');
      else if (lang === 'en') unit = n === 1 ? ' category' : ' categories';
      else unit = T('类');
      if (s.textContent !== unit) {
        if (s.childNodes.length === 1 && s.firstChild.nodeType === 3) s.firstChild.nodeValue = unit;
        else s.textContent = unit;
      }
    });
  }

  function refreshDots() {
    var nav = document.getElementById('dotnav');
    if (nav) nav.setAttribute('aria-label', T('章节导航'));
    var secs = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('#dotnav button'));
    dots.forEach(function (d, i) {
      var h = secs[i] && secs[i].querySelector('h2');
      if (h) d.setAttribute('title', T(origText(h)));
    });
  }

  function paintHero() {
    var h1 = document.getElementById('artTitle');
    if (!h1) return;
    if (!artOriginal) artOriginal = h1.innerHTML;
    if (lang === 'zh-CN') { h1.innerHTML = artOriginal; return; }
    var text = HEAD[lang] || HEAD['zh-CN'];
    var units = (lang === 'en' || lang === 'ru') ? text.split(/\s+/) : Array.from(text);
    var sz = [1.25, 1, 0.85, 1.4, 1.05, 0.8], rot = [-2, 2, -1, 3, -2, 1], dy = [-3, 2, -2, -5, 0, 3];
    h1.innerHTML = units.map(function (u, i) {
      return '<span class="ac" style="--s:' + sz[i % 6] + ';--r:' + rot[i % 6] + 'deg;--y:' + dy[i % 6] + 'px">' + u + '</span>';
    }).join(lang === 'en' || lang === 'ru' ? ' ' : '');
  }

  function syncMenu() {
    var cur = document.getElementById('langCur'), code = document.getElementById('langCode');
    if (cur) cur.textContent = { 'zh-CN': '简体', 'zh-TW': '繁體', 'en': 'English', 'ja': '日本語', 'ru': 'Русский' }[lang];
    if (code) code.textContent = CODE[lang];
    var items = document.querySelectorAll('.lang-item');
    Array.prototype.forEach.call(items, function (b) { b.setAttribute('aria-checked', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
  }

  function store(v) { try { localStorage.setItem('site-lang', v); } catch (e) {} }
  function stored() { try { return localStorage.getItem('site-lang'); } catch (e) { return null; } }

  function apply(id) {
    if (LANGS.indexOf(id) < 0) id = 'zh-CN';
    setDict(id);
    document.documentElement.setAttribute('lang', id === 'zh-CN' ? 'zh-CN' : id);
    document.documentElement.setAttribute('data-lang', id);
    if (id === 'zh-CN') document.documentElement.style.removeProperty('--site-font');
    else if (FONT_LANG[id]) document.documentElement.style.setProperty('--site-font', FONT_LANG[id]);
    else document.documentElement.style.removeProperty('--site-font');
    walkText(document.body);
    walkAttrs();
    fixUnits();
    paintHero();
    relabelCharts();
    refreshDots();
    syncMenu();
    var b = document.getElementById('navBrand');
    if (b) b.textContent = BRAND[id];
    document.title = TITLES[id];
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', DESCS[id]);
    if (window.onlangchange) window.onlangchange(id);
  }

  function setLang(id) { apply(id); store(id); }

  function mount() {
    var wrap = document.getElementById('langMenu');
    var btn = document.getElementById('langBtn');
    if (!wrap || !btn) return;
    Array.prototype.forEach.call(wrap.querySelectorAll('.lang-item'), function (item) {
      item.addEventListener('click', function () {
        setLang(item.getAttribute('data-lang'));
        close();
      });
    });
    function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var on = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    document.addEventListener('click', function (ev) { if (!wrap.contains(ev.target)) close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
  }

  var initial = stored();
  if (LANGS.indexOf(initial) < 0) initial = 'zh-CN';
  setDict(initial);
  lang = initial;

  window.I18N = {
    T: T, lang: function () { return lang; }, langs: LANGS, set: setLang,
    num: { yi: yi }, chartFont: function () { return FONT_LANG[lang] || ''; },
    boot: function () { apply(lang); mount(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.I18N.boot(); });
  else window.I18N.boot();
})();
