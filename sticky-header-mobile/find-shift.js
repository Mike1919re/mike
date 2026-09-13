/* ==========================================================================
   איתור "תזוזה" במובייל — גלישה אופקית וקפיצת תוכן
   ---------------------------------------------------------------------------
   Chrome ← F12 ← Device Toolbar (Ctrl+Shift+M) ← iPhone ← Console ←
   הדבק את כל הקובץ ← Enter. מחזיר את הדף למקומו בסיום.

   מוצא את האלמנט שגורם לדף להיות רחב מהמסך — הסיבה לכך שהתוכן נחתך
   בצד ובזוזה כשמחליקים. מבדיל בין שורש הבעיה לאלמנטים שרק נגררים אחריו.
   ========================================================================== */
(async function () {
  'use strict';

  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var R = function (n) { return Math.round(n); };

  // מייצר מזהה קריא לאלמנט
  function label(el) {
    var s = el.tagName.toLowerCase();
    if (el.id) { s += '#' + el.id; }
    var cls = (el.getAttribute('class') || '').trim().split(/\s+/)
      .filter(function (c) { return c && !/^elementor-(element|invisible)/.test(c); })
      .slice(0, 3).join('.');
    if (cls) { s += '.' + cls; }
    if (el.tagName === 'IMG' && el.currentSrc) {
      s += '  [' + el.currentSrc.split('/').pop().slice(0, 40) + ']';
    }
    var txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    if (txt && el.children.length === 0) { s += '  "' + txt + '"'; }
    return s;
  }

  function path(el) {
    var parts = [], n = el, depth = 0;
    while (n && n !== document.body && depth < 4) {
      parts.unshift(label(n).split('  ')[0]);
      n = n.parentElement; depth++;
    }
    return 'body > … > ' + parts.join(' > ');
  }

  var scrollBackY = window.pageYOffset;
  window.scrollTo(0, 0);
  await wait(350);

  var vw = document.documentElement.clientWidth;
  var docW = document.documentElement.scrollWidth;
  var rtl = getComputedStyle(document.documentElement).direction === 'rtl' ||
            getComputedStyle(document.body).direction === 'rtl';

  console.log('%cאיתור תזוזה — ' + location.hostname,
              'font-weight:bold;font-size:14px');
  console.log('רוחב מסך: ' + vw + 'px   רוחב הדף: ' + docW + 'px   כיוון: ' +
              (rtl ? 'RTL' : 'LTR'));
  console.log('—'.repeat(52));

  var overflow = docW - vw;
  if (overflow <= 1) {
    console.log('%c✅ אין גלישה אופקית. הדף בדיוק ברוחב המסך.',
                'color:#0a0;font-weight:bold');
    console.log('   אם אתה עדיין רואה תזוזה, היא אנכית — ראה בדיקת הקפיצה למטה.');
  } else {
    console.log('%c❌ הדף רחב מהמסך ב-' + overflow + 'px — זו הסיבה לתזוזה.',
                'color:#c00;font-weight:bold');
  }

  // --- איתור האשמים -----------------------------------------------------
  /* מדידה שלא תלויה במיקום הגלילה האופקית: בגלילה אופקית ב-RTL כל האלמנטים
     התקינים "נראים" חורגים, ולכן משווים רוחב מול המסך ומול ההורה, לא מול החלון.
     שלושה סוגי אשם:
       A. האלמנט עצמו רחב מהמסך
       B. התוכן שבתוכו רחב ממנו (טקסט nowrap, טבלה) והוא לא חותך אותו
       C. הוא בולט מגבולות ההורה (מרג'ין שלילי, absolute) וההורה לא חותך */
  var all = document.querySelectorAll('body *');
  var roots = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') { continue; }
    if (cs.position === 'fixed') { continue; }
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) { continue; }

    var kind = '', out = 0;

    if (R(r.width) - vw > 1) {
      kind = 'רחב מהמסך'; out = R(r.width) - vw;
    } else if (cs.overflowX === 'visible' && el.scrollWidth - el.clientWidth > 1 &&
               el.clientWidth > 0) {
      kind = 'התוכן שבתוכו רחב ממנו'; out = el.scrollWidth - el.clientWidth;
    } else {
      var par = el.parentElement;
      if (par && par !== document.documentElement) {
        var pcs = getComputedStyle(par);
        var pr = par.getBoundingClientRect();
        if (pcs.overflowX === 'visible' && pr.width > 0) {
          var stick = Math.max(R(r.right - pr.right), R(pr.left - r.left));
          if (stick > 1) { kind = 'בולט מגבולות ההורה'; out = stick; }
        }
      }
    }
    if (kind) { roots.push({ el: el, out: out, rect: r, cs: cs, kind: kind }); }
  }

  // עטיפה ש"התוכן שלה רחב ממנה" היא תסמין של אלמנט שכבר סומן בתוכה — לא שורש
  roots = roots.filter(function (o) {
    return !roots.some(function (q) {
      return q !== o && o.el.contains(q.el) &&
             (o.kind === 'התוכן שבתוכו רחב ממנו' || q.out >= o.out - 1);
    });
  }).sort(function (a, b) { return b.out - a.out; });

  if (roots.length) {
    console.log('\n%cשורש הבעיה — ' + roots.length + ' אלמנטים חורגים:',
                'font-weight:bold');
    roots.slice(0, 10).forEach(function (o, n) {
      console.log('\n' + (n + 1) + '. ' + label(o.el));
      console.log('   ' + o.kind + ' ב-' + o.out + 'px   |   רוחב: ' +
                  R(o.rect.width) + 'px מתוך ' + vw + 'px מסך');
      var hints = [];
      if (/vw/.test(o.cs.width)) { hints.push('רוחב ביחידות vw'); }
      if (parseFloat(o.cs.marginLeft) < 0 || parseFloat(o.cs.marginRight) < 0) {
        hints.push("מרג'ין שלילי (" + o.cs.marginLeft + ' / ' + o.cs.marginRight + ')');
      }
      if (o.cs.position === 'absolute') { hints.push('position:absolute'); }
      if (o.cs.whiteSpace === 'nowrap') { hints.push('white-space:nowrap — טקסט שלא נשבר'); }
      if (/^(IMG|IFRAME|VIDEO|TABLE|PRE)$/.test(o.el.tagName) && o.cs.maxWidth === 'none') {
        hints.push('ללא max-width:100%');
      }
      if (/px$/.test(o.cs.width) && parseFloat(o.cs.width) > vw) {
        hints.push('רוחב קבוע ' + o.cs.width);
      }
      if (hints.length) { console.log('   חשוד: ' + hints.join('  |  ')); }
      console.log('   ' + path(o.el));
      console.log(o.el);
    });
  } else if (overflow > 1) {
    console.log("\n⚠️ הדף רחב מהמסך אך לא אותר אלמנט בודד — בדוק מרג'ין/padding על body.");
    console.log('   body margin: ' + getComputedStyle(document.body).margin +
                '   padding: ' + getComputedStyle(document.body).padding);
  }

  // --- overflow-x קיים? --------------------------------------------------
  var hx = getComputedStyle(document.documentElement).overflowX;
  var bx = getComputedStyle(document.body).overflowX;
  console.log('\noverflow-x:   html=' + hx + '   body=' + bx);
  if (hx === 'hidden' || bx === 'hidden') {
    console.log('⚠️ overflow-x:hidden כבר מוגדר — הוא מסתיר את התסמין אך לא את הסיבה,');
    console.log('   ועלול לשבור position:sticky של אלמנטים בתוך הדף.');
  }

  // --- קפיצה אנכית מההדר הדביק ------------------------------------------
  console.log('\n' + '—'.repeat(52));
  console.log('%cבדיקת קפיצה אנכית (הדר דביק)', 'font-weight:bold');
  var ref = document.querySelector('main, .elementor-location-single, ' +
                                   '.site-main, #content, article');
  if (!ref) {
    console.log('   לא אותר אזור תוכן להשוואה — מדלג.');
  } else {
    window.scrollTo(0, 0); await wait(400);
    var before = R(ref.getBoundingClientRect().top + window.pageYOffset);
    window.scrollTo(0, 600); await wait(600);
    window.scrollTo(0, 0); await wait(600);
    var after = R(ref.getBoundingClientRect().top + window.pageYOffset);
    if (Math.abs(after - before) <= 2) {
      console.log('✅ התוכן לא קופץ בגלילה   (' + before + 'px → ' + after + 'px)');
    } else {
      console.log('%c❌ התוכן קופץ ב-' + Math.abs(after - before) +
                  'px בגלילה — ה-spacer של ההדר הדביק לא תואם לגובהו.',
                  'color:#c00;font-weight:bold');
      console.log('   ' + before + 'px → ' + after + 'px');
    }
  }

  window.scrollTo(0, scrollBackY);
  console.log('—'.repeat(52));
  return { viewport: vw, documentWidth: docW, overflowPx: Math.max(0, overflow),
           culprits: roots.length };
})();
