/* ==========================================================================
   בדיקת הדר דביק במובייל — הרץ בקונסול על האתר החי
   ---------------------------------------------------------------------------
   Chrome ← F12 ← Device Toolbar (Ctrl+Shift+M) ← iPhone ← טאב Console ←
   הדבק את כל הקובץ ← Enter. הבדיקה גוללת ומחזירה את הדף למקומו.
   ========================================================================== */
(async function () {
  'use strict';

  var pass = 0, fail = 0, warn = 0;
  var log = function (state, msg, detail) {
    var icon = state === 'ok' ? '✅' : state === 'warn' ? '⚠️' : '❌';
    if (state === 'ok') { pass++; } else if (state === 'warn') { warn++; } else { fail++; }
    console.log(icon + ' ' + msg + (detail ? '   ← ' + detail : ''));
  };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var round = function (n) { return Math.round(n); };

  console.log('%cבדיקת הדר דביק — ' + location.hostname,
              'font-weight:bold;font-size:14px');
  console.log('רוחב חלון: ' + window.innerWidth + 'px' +
              (window.innerWidth <= 767 ? '  (מובייל)' : '  (לא מובייל)'));
  console.log('—'.repeat(46));

  var CANDIDATES = ['.shm-host', '.elementor-location-header', '[data-elementor-type="header"]',
                    'header#masthead', 'header.site-header', '#masthead', '.site-header',
                    'header[role="banner"]', '#header', 'body > header'];

  // --- איתור ההדר -------------------------------------------------------
  var header = null, usedSelector = '';
  for (var i = 0; i < CANDIDATES.length; i++) {
    var el = document.querySelector(CANDIDATES[i]);
    if (el && el.getBoundingClientRect().height > 0 &&
        el.getBoundingClientRect().top < window.innerHeight) {
      header = el; usedSelector = CANDIDATES[i]; break;
    }
  }
  if (!header) {
    log('fail', 'לא נמצא הדר בדף — אין מה לבדוק');
    return;
  }
  log('ok', 'הדר אותר', usedSelector);

  // --- איזה מנגנון פועל --------------------------------------------------
  var hasSnippet = !!(document.querySelector('.shm-spacer') || document.getElementById('shm-script'));
  var hasElementorSticky = /elementor-sticky/.test(header.className) ||
                           !!header.querySelector('.elementor-sticky') ||
                           !!document.querySelector('.elementor-sticky');
  var mech = hasSnippet ? 'הסניפט שלנו'
           : hasElementorSticky ? 'Sticky המובנה של אלמנטור'
           : 'לא זוהה מנגנון ייעודי';
  console.log('מנגנון: ' + mech);
  if (hasSnippet && hasElementorSticky) {
    log('fail', 'שני מנגנונים פעילים בו-זמנית — בטל אחד מהם',
        'צפוי מרווח כפול או קפיצות');
  }

  // --- מצב בראש הדף ------------------------------------------------------
  var scrollBack = window.pageYOffset;
  window.scrollTo(0, 0);
  await wait(400);
  var posTop = getComputedStyle(header).position;
  var hTop = round(header.getBoundingClientRect().height);
  var docBefore = round(document.body.scrollHeight);

  // --- מצב אחרי גלילה ----------------------------------------------------
  window.scrollTo(0, Math.min(1200, document.body.scrollHeight - window.innerHeight));
  await wait(700);
  var rect = header.getBoundingClientRect();
  var posScrolled = getComputedStyle(header).position;
  var stuck = rect.bottom > 0 && rect.top < window.innerHeight * 0.5;

  if (window.innerWidth <= 767) {
    if (stuck) {
      log('ok', 'ההדר נשאר גלוי אחרי גלילה',
          'position:' + posScrolled + ', top=' + round(rect.top) + 'px');
    } else {
      log('fail', 'ההדר נעלם בגלילה — הדביקות לא פועלת',
          'position:' + posScrolled + ', top=' + round(rect.top) + 'px');
    }
    if (stuck && rect.top > 60) {
      log('warn', 'ההדר לא צמוד לקצה העליון',
          'מרווח של ' + round(rect.top) + 'px מלמעלה');
    }
  } else {
    if (stuck) {
      log('fail', 'ההדר דביק גם ברוחב דסקטופ — הוגדר "מובייל בלבד"?',
          'position:' + posScrolled);
    } else {
      log('ok', 'בדסקטופ ההדר נגלל כרגיל — כנדרש');
    }
  }

  // --- חסימה על ידי אלמנט אחר -------------------------------------------
  if (stuck) {
    var probe = document.elementFromPoint(round(window.innerWidth / 2),
                                          round(rect.top + Math.min(rect.height / 2, 20)));
    var covered = probe && probe !== header && !header.contains(probe);
    if (covered) {
      log('fail', 'אלמנט אחר מכסה את ההדר — הגדל את --shm-z',
          (probe.tagName + '.' + (probe.className || '')).slice(0, 60));
    } else {
      log('ok', 'ההדר לא מוסתר על ידי אלמנט אחר');
    }
  }

  // --- קפיצת תוכן --------------------------------------------------------
  var spacer = document.querySelector('.shm-spacer');
  if (hasSnippet) {
    if (!spacer) {
      log('fail', 'ה-spacer לא נשתל — ה-JS של הסניפט לא רץ');
    } else {
      var sh = round(spacer.getBoundingClientRect().height);
      if (Math.abs(sh - hTop) <= 2 && sh > 0) {
        log('ok', 'ה-spacer תואם לגובה ההדר — אין קפיצת תוכן',
            sh + 'px');
      } else {
        log('fail', 'ה-spacer לא תואם לגובה ההדר — התוכן יקפוץ',
            'spacer=' + sh + 'px מול הדר=' + hTop + 'px');
      }
    }
    var vTop = getComputedStyle(document.documentElement).getPropertyValue('--shm-top').trim();
    console.log('   --shm-top: ' + (vTop || '0px') +
                (document.getElementById('wpadminbar') ? '  (סרגל ניהול קיים)' : ''));
  }

  // --- אב-קדמון ששובר fixed ---------------------------------------------
  if (window.innerWidth <= 767) {
    var broken = null;
    for (var p = header.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      var cs = getComputedStyle(p);
      if ((cs.transform && cs.transform !== 'none') || (cs.filter && cs.filter !== 'none') ||
          (cs.perspective && cs.perspective !== 'none')) { broken = p; break; }
    }
    if (broken && posScrolled === 'fixed') {
      log('fail', 'אב-קדמון עם transform שובר את position:fixed',
          (broken.tagName + '.' + (broken.className || '')).slice(0, 60));
    } else {
      log('ok', 'אין אב-קדמון ששובר את הדביקות');
    }

    // --- גובה סביר ------------------------------------------------------
    var ratio = hTop / window.innerHeight;
    if (ratio > 0.22) {
      log('warn', 'ההדר תופס ' + Math.round(ratio * 100) +
          '% מגובה המסך — שקול להקטין אותו במובייל', hTop + 'px');
    } else {
      log('ok', 'גובה ההדר סביר למובייל', hTop + 'px');
    }

    // --- רקע --------------------------------------------------------------
    var bg = getComputedStyle(header).backgroundColor;
    var bgi = getComputedStyle(header).backgroundImage;
    var transparent = bgi === 'none' && (!bg || bg === 'transparent' || /,\s*0\)$/.test(bg));
    if (transparent) {
      var filled = false, kids = header.querySelectorAll('*');
      for (var k = 0; k < kids.length; k++) {
        var kr = kids[k].getBoundingClientRect(), kc = getComputedStyle(kids[k]);
        if (kr.width >= rect.width * 0.9 && kr.height >= rect.height * 0.9 &&
            (kc.backgroundImage !== 'none' || (kc.backgroundColor && kc.backgroundColor !== 'transparent' &&
             !/,\s*0\)$/.test(kc.backgroundColor)))) { filled = true; break; }
      }
      if (!filled) {
        log('fail', 'להדר אין רקע — התוכן יראה מבעדו בגלילה',
            'הגדר :root{--shm-bg:#…}');
      } else { log('ok', 'להדר יש רקע אטום'); }
    } else {
      log('ok', 'להדר יש רקע אטום', bg);
    }
  }

  // --- שינוי בגובה המסמך --------------------------------------------------
  if (round(document.body.scrollHeight) !== docBefore) {
    log('warn', 'גובה המסמך השתנה בזמן הבדיקה (לאזי טעינה)');
  }

  window.scrollTo(0, scrollBack);
  console.log('—'.repeat(46));
  console.log('%c' + pass + ' עברו   ' + fail + ' נכשלו   ' + warn + ' אזהרות',
              'font-weight:bold;font-size:13px');
  console.log('הרץ שוב ברוחב דסקטופ כדי לוודא ששם ההדר לא דביק.');
  return { pass: pass, fail: fail, warn: warn, mechanism: mech, selector: usedSelector };
})();
