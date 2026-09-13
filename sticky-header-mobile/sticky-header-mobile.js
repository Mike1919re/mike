/* ==========================================================================
   Sticky Header — Mobile only
   ---------------------------------------------------------------------------
   מחיל הדר דביק בתצוגת מובייל בלבד, בלי לגעת בתצוגת דסקטופ.
   עובד עם הדר של אלמנטור (Theme Builder) וגם עם הדר של תבנית וורדפרס רגילה,
   בלי לדעת מראש את הסלקטור.

   עקרונות:
   1. ההדר מקבל position:fixed, ובמקומו במסמך נשתל spacer בגובה זהה —
      כך אין קפיצה של התוכן ואין מלחמה עם ה-padding של התבנית.
   2. הגובה נמדד בפועל ומתעדכן (ResizeObserver / טעינת פונטים / סיבוב מסך),
      כדי שהמרווח יישאר מדויק גם אחרי שהלוגו נטען או שהתפריט משנה שורה.
   3. נקודת השבירה מוגדרת כאן בלבד, ומסונכרנת ל-CSS דרך המחלקה shm-on.

   התאמה אישית לפני הטעינה (אופציונלי):
     window.SHM_CONFIG = { maxWidth: 767, selector: '#my-header' };
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULTS = {
    // מעל הרוחב הזה ההדר חוזר להתנהגות המקורית. 767 = breakpoint המובייל של אלמנטור.
    maxWidth: 767,
    // סלקטור מפורש. ריק = זיהוי אוטומטי.
    selector: '',
    // התחשבות בסרגל הניהול של וורדפרס כשהוא נעול לראש המסך.
    adminBar: true,
    // הוספת צל אחרי תחילת גלילה.
    shadow: true,
    // כמה פיקסלים של גלילה עד שהצל מופיע.
    shadowAfter: 4,
    // הדפסת מידע אבחון לקונסול.
    debug: false
  };

  var CONFIG = DEFAULTS;
  if (window.SHM_CONFIG) {
    CONFIG = {};
    for (var k in DEFAULTS) { CONFIG[k] = DEFAULTS[k]; }
    for (var j in window.SHM_CONFIG) { CONFIG[j] = window.SHM_CONFIG[j]; }
  }

  // סדר הניסיונות: מהעטיפה החיצונית של אלמנטור פנימה, ואז תבניות וורדפרס נפוצות.
  var CANDIDATES = [
    '[data-shm-header]',
    '.elementor-location-header',
    '[data-elementor-type="header"]',
    'header#masthead',
    'header.site-header',
    '#masthead',
    '.site-header',
    'header[role="banner"]',
    '#header',
    'body > header'
  ];

  // סימנים לכך שתפריט המובייל פתוח, על פני אלמנטור ותבניות נפוצות.
  var MENU_OPEN = [
    '.elementor-menu-toggle.elementor-active',
    '.elementor-nav-menu--dropdown[aria-hidden="false"]',
    '[aria-expanded="true"]',
    '.menu-toggle.toggled-on',
    '.menu-toggle.active',
    '.is-menu-open'
  ].join(',');

  var root = document.documentElement;
  var header = null;
  var spacer = null;
  var active = false;
  var lastHeight = -1;
  var lastTop = -1;

  function log() {
    if (!CONFIG.debug || !window.console) { return; }
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[sticky-header-mobile]');
    console.log.apply(console, args);
  }

  function isVisible(el) {
    if (!el) { return false; }
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') { return false; }
    return el.getBoundingClientRect().height > 0;
  }

  function findHeader() {
    if (CONFIG.selector) {
      return document.querySelector(CONFIG.selector);
    }
    for (var i = 0; i < CANDIDATES.length; i++) {
      var el = document.querySelector(CANDIDATES[i]);
      // הדר שמופיע רק בהמשך הדף (למשל כותרת של סקשן) אינו ההדר של האתר.
      if (isVisible(el) && el.getBoundingClientRect().top < window.innerHeight) {
        log('נבחר הדר לפי', CANDIDATES[i], el);
        return el;
      }
    }
    return null;
  }

  /* fixed נשבר בתוך אב-קדמון עם transform/filter/perspective — אלמנטור מייצר
     כאלה דרך אפקטי תנועה ורקעים. מנטרלים רק על שרשרת ההורים של ההדר. */
  function neutralizeAncestors(el) {
    var p = el.parentElement;
    while (p && p !== document.body && p !== root) {
      var cs = getComputedStyle(p);
      var breaksFixed =
        (cs.transform && cs.transform !== 'none') ||
        (cs.filter && cs.filter !== 'none') ||
        (cs.perspective && cs.perspective !== 'none') ||
        (cs.backdropFilter && cs.backdropFilter !== 'none') ||
        (cs.willChange && cs.willChange.indexOf('transform') > -1) ||
        (cs.contain && /paint|layout|strict|content/.test(cs.contain));
      if (breaksFixed) {
        p.classList.add('shm-unstick-ancestor');
        log('נוטרל אב-קדמון ששובר position:fixed', p);
      }
      p = p.parentElement;
    }
  }

  /* הדר שקוף (overlay מעל תמונת פתיחה) שנעשה דביק הופך לבלתי קריא, כי התוכן
     נגלל מתחתיו. רק במקרה כזה מוסיפים רקע — אחרת לא נוגעים בעיצוב של האתר.
     נספרים רק רקעים של אלמנטים שממלאים כמעט את כל שטח ההדר, כדי שכפתור או
     תג צבעוני בתוך ההדר לא ייחשבו בטעות כרקע. */
  function isTransparentBg(cs) {
    if (cs.backgroundImage && cs.backgroundImage !== 'none') { return false; }
    var bg = cs.backgroundColor;
    if (!bg || bg === 'transparent') { return true; }
    var m = bg.match(/rgba?\(([^)]+)\)/);
    if (!m) { return false; }
    var parts = m[1].split(',');
    return parts.length > 3 && parseFloat(parts[3]) === 0;
  }

  function ensureBackground(el) {
    var box = el.getBoundingClientRect();
    if (!box.height) { return; }
    if (!isTransparentBg(getComputedStyle(el))) { return; }
    var kids = el.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      var r = kids[i].getBoundingClientRect();
      var fills = r.width >= box.width * 0.9 && r.height >= box.height * 0.9;
      if (fills && !isTransparentBg(getComputedStyle(kids[i]))) { return; }
    }
    el.classList.add('shm-needs-bg');
    log('ההדר שקוף — הוחל רקע דרך --shm-bg');
  }

  function topOffset() {
    var offset = 0;
    if (CONFIG.adminBar) {
      var bar = document.getElementById('wpadminbar');
      // מתחת ל-600px וורדפרס הופך את הסרגל ל-absolute והוא נגלל החוצה — אז אין היסט.
      if (bar && getComputedStyle(bar).position === 'fixed') {
        offset += bar.getBoundingClientRect().height;
      }
    }
    var extras = document.querySelectorAll('.shm-offset-above');
    for (var i = 0; i < extras.length; i++) {
      if (getComputedStyle(extras[i]).position === 'fixed') {
        offset += extras[i].getBoundingClientRect().height;
      }
    }
    return offset;
  }

  function measure() {
    if (!active || !header) { return; }
    var h = Math.round(header.getBoundingClientRect().height);
    var t = Math.round(topOffset());
    // בזמן שהתפריט פתוח ההדר גבוה זמנית — לא משנים את המרווח, אחרת הדף קופץ.
    if (!header.classList.contains('shm-menu-open') && h > 0 && h !== lastHeight) {
      lastHeight = h;
      root.style.setProperty('--shm-h', h + 'px');
    }
    if (t !== lastTop) {
      lastTop = t;
      root.style.setProperty('--shm-top', t + 'px');
    }
  }

  function syncMenuState() {
    if (!active || !header) { return; }
    var open = !!header.querySelector(MENU_OPEN);
    header.classList.toggle('shm-menu-open', open);
    if (!open) { header.scrollTop = 0; }
  }

  function onScroll() {
    if (!CONFIG.shadow || !active || !header) { return; }
    header.classList.toggle('shm-scrolled', window.pageYOffset > CONFIG.shadowAfter);
  }

  function enable() {
    if (active || !header) { return; }
    active = true;
    lastHeight = -1;
    lastTop = -1;
    header.classList.add('shm-host');
    root.classList.add('shm-on');
    neutralizeAncestors(header);
    ensureBackground(header);
    measure();
    syncMenuState();
    onScroll();
    log('הופעל');
  }

  function disable() {
    if (!active) { return; }
    active = false;
    root.classList.remove('shm-on');
    if (header) {
      header.classList.remove('shm-host', 'shm-menu-open', 'shm-scrolled', 'shm-needs-bg');
      header.scrollTop = 0;
    }
    root.style.removeProperty('--shm-h');
    root.style.removeProperty('--shm-top');
    log('כובה');
  }

  function init() {
    // לא נוגעים בעורך של אלמנטור — שם ההדר חייב להישאר בזרימה הרגילה.
    if (document.body.classList.contains('elementor-editor-active') ||
        (window.elementorFrontend && window.elementorFrontend.isEditMode &&
         window.elementorFrontend.isEditMode())) {
      log('רץ בתוך עורך אלמנטור — מדלג');
      return;
    }

    header = findHeader();
    if (!header) {
      if (window.console) {
        console.warn('[sticky-header-mobile] לא נמצא הדר. הגדר סלקטור מפורש: ' +
                     'window.SHM_CONFIG = { selector: "#your-header" };');
      }
      return;
    }

    spacer = document.createElement('div');
    spacer.className = 'shm-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    header.parentNode.insertBefore(spacer, header.nextSibling);

    var mq = window.matchMedia('(max-width: ' + CONFIG.maxWidth + 'px)');
    var apply = function () { mq.matches ? enable() : disable(); };
    if (mq.addEventListener) { mq.addEventListener('change', apply); }
    else if (mq.addListener) { mq.addListener(apply); }
    apply();

    if (window.ResizeObserver) {
      new ResizeObserver(measure).observe(header);
    }
    new MutationObserver(function () { syncMenuState(); measure(); })
      .observe(header, { attributes: true, subtree: true,
                         attributeFilter: ['class', 'aria-expanded', 'aria-hidden', 'style'] });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('orientationchange', function () { setTimeout(measure, 250); });
    window.addEventListener('load', measure);
    // רוחב הלוגו והתפריט משתנה אחרי טעינת הפונטים ולכן נדרשת מדידה חוזרת.
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
