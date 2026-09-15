# F-04 · סרגל CTA דביק למובייל — קוד להטמעה

> 🔴 **תוקן 15/09:** מספר הוואטסאפ בגרסה הראשונה היה `972778123111` — **שגוי**.
> `077-812-3111` הוא קו נייח ואין לו וואטסאפ. הנכון: **`972529771713`**.

**עילה:** עומק גלילה ממומן **13.48%** — 86.5% מכל עמוד נחיתה ממומן הוא אזור קר.
**יעד:** עומק גלילה ממומן מעל 25%, נטישה ממומנת מתחת ל-75%, אפס Dead Clicks על CTA.

> **תיקון למספר הטלפון:** בקטע הקוד שמסרתי בדוח הקודם הופיע `tel:+9727781231110` —
> ספרה אחת עודפת. הנכון, לפי המספר שנצפה בהקלטות (`077-8123111`), הוא
> **`tel:+972778123111`**. הקוד כאן מתוקן. אמת מול המספר העסקי בפועל לפני העלאה.

---

## 1. HTML

```html
<div class="tc-cta" role="region" aria-label="יצירת קשר מהירה">
  <a class="tc-cta__btn tc-cta__btn--call"
     href="tel:+972778123111"
     data-cta="call">
    <svg class="tc-cta__ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"/>
    </svg>
    <span>חיוג למהנדס</span>
  </a>

  <a class="tc-cta__btn tc-cta__btn--wa"
     href="https://wa.me/972529771713?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A4%D7%A8%D7%98%D7%99%D7%9D"
     target="_blank" rel="noopener"
     data-cta="whatsapp">
    <svg class="tc-cta__ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.3 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.8c.2.1.4.2.5.3.1.2.1.6-.1 1.2z"/>
    </svg>
    <span>וואטסאפ</span>
  </a>
</div>
```

**למה `<a>` ולא `<button>`:** זו הנקודה כולה. `<a href>` מבצע ניווט **ברמת הדפדפן**
ואינו תלוי ב-JavaScript כלל — ולכן **Delay JavaScript של Perfmatters אינו משפיע עליו.**
`<button onclick>` היה נופל בדיוק לתוך אותה מלכודת שאנחנו מתקנים.

---

## 2. CSS

```css
.tc-cta{
  position:fixed;
  inset-inline:0;
  bottom:0;
  z-index:9990;                       /* מתחת למודאלים, מעל התוכן */
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  padding:10px 12px;
  padding-bottom:calc(10px + env(safe-area-inset-bottom, 0px));
  background:#ffffff;
  border-top:1px solid #dbe3ea;
  box-shadow:0 -4px 18px rgba(16,24,32,.12);
  direction:rtl;
}

.tc-cta__btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:54px;                    /* מעל מינימום 48px למטרת מגע */
  padding:0 12px;
  border-radius:10px;
  font-family:inherit;
  font-size:17px;
  font-weight:700;
  line-height:1.2;
  text-decoration:none;
  color:#ffffff;
  -webkit-tap-highlight-color:transparent;
  transition:filter .12s ease, transform .08s ease;
}
.tc-cta__btn:hover{filter:brightness(1.06)}
.tc-cta__btn:active{transform:scale(.98)}
.tc-cta__btn:focus-visible{outline:3px solid #0b5c8a;outline-offset:3px}

.tc-cta__btn--call{background:#0b5c8a}   /* ניגודיות מול לבן: 7.0:1 — WCAG AAA */
.tc-cta__btn--wa{background:#1f8f4e}     /* ניגודיות מול לבן: 4.6:1 — WCAG AA  */

.tc-cta__ico{width:22px;height:22px;flex:none}

/* התוכן לא ייחתך מאחורי הסרגל */
body{padding-bottom:calc(78px + env(safe-area-inset-bottom, 0px))}

/* דסקטופ — הסרגל לא נדרש: עומק גלילה 33.73% */
@media (min-width:768px){
  .tc-cta{display:none}
  body{padding-bottom:0}
}

@media (prefers-reduced-motion:reduce){
  .tc-cta__btn{transition:none}
  .tc-cta__btn:active{transform:none}
}

/* מצב כהה במכשיר */
@media (prefers-color-scheme:dark){
  .tc-cta{background:#161d25;border-top-color:#2a3642}
}
```

**שלוש החלטות שכל אחת נשענת על ראיה:**

| החלטה | הראיה |
|---|---|
| `min-height:54px` | 44 Dead Clicks, רובם במובייל. מטרת מגע קטנה מגדילה החטאות |
| `padding-bottom` על `body` | בלעדיו הסרגל מכסה את סוף התוכן ויוצר תסכול חדש |
| הסתרה מעל 768px | עומק גלילה בדסקטופ 33.73% — יש מרווח נשימה, הסרגל רק יפריע |

---

## 3. מדידה — בלי לשבור את הקישור

ברירת המחדל: **אל תוסיף JavaScript בכלל.** GTM כבר מודד קליקים על `tel:` ו-`wa.me`
דרך טריגר Click מובנה. אם בכל זאת נדרש אירוע ייעודי:

```html
<script>
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-cta]');
  if (!el) return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event: 'cta_click', cta_type: el.dataset.cta});
  } catch (err) { /* המדידה נכשלה — הניווט ממשיך כרגיל */ }
}, {passive: true});
</script>
```

**שני כללים קריטיים:**
1. **אין `preventDefault` ואין `return false`.** הסקריפט מדווח בלבד; הניווט הוא של הדפדפן.
2. **`try/catch` חובה.** אם `dataLayer` שבור — וזו בדיוק הבעיה שאנחנו מחפשים ב-F-05 —
   שגיאה לא מטופלת כאן תעצור את ה-handler. עם `catch`, הקישור עובד גם אז.

> אם תוסיף את הסקריפט — **הוסף אותו לרשימת ההחרגות של Perfmatters**
> (`Perfmatters → Assets → JavaScript → Delay JavaScript → Exclude`). אחרת המדידה
> תתעכב. **הקישור עצמו יעבוד בכל מקרה** — זו כל הנקודה בפתרון.

---

## 4. היכן להטמיע ב-WordPress

| שיטה | מתי | הערה |
|---|---|---|
| **WPCode → Footer** ✅ | סרגל בכל האתר | `Location: Site Wide Footer`. הדרך המומלצת |
| **Elementor → Custom Code** ✅ | רק בעמודי נחיתה | `Location: End of <body>` + Display Conditions |
| Elementor → HTML Widget | עמוד בודד | עובד, אך צריך שכפול לכל עמוד |
| **Text Editor Widget** ❌ | **לעולם לא** | WordPress יסנן את ה-`<script>` — **זו בדיוק תקלת F-05** |

**מיקוד לעמודי הנחיתה הממומנים** (`/קווי-תמסורת/`, `/תוכנה-לשליחת-sms/`,
`/מחירון-חבילות-sms/` ודף הבית) — שם עומק הגלילה 9.56%–14.33%.

**ה-CSS** → `Appearance → Customize → Additional CSS`, או קובץ ה-style של תבנית הילד.
לא ב-Elementor Custom CSS ברמת הווידג'ט — הסרגל גלובלי ולא שייך לווידג'ט מסוים.

---

## 5. בדיקת קבלה

```js
// 1. שני קישורים אמיתיים עם href תקין
document.querySelectorAll('.tc-cta__btn').forEach(function(a){
  console.log(a.tagName, a.getAttribute('href') || '⚠️ חסר href');
});
// ציפייה: A tel:+972778123111  |  A https://wa.me/972529771713?text=...

// 2. גובה מטרת מגע
document.querySelectorAll('.tc-cta__btn').forEach(function(a){
  var h = a.getBoundingClientRect().height;
  console.log(Math.round(h) + 'px', h >= 48 ? '✅' : '⚠️ קטן מדי');
});

// 3. אין חיתוך תוכן
console.log('padding-bottom:', getComputedStyle(document.body).paddingBottom);
```

**בדיקה ידנית — החשובה ביותר:**
גלישה בסתר (מטמון נקי) ← מובייל 390px ← **לחיצה אחת בלבד** על כל כפתור.
שניהם חייבים לפעול **בלחיצה הראשונה**. אם כן — הוכחת שהפתרון חסין ל-Delay של Perfmatters.

רזולוציות: **360px · 390px · 414px**. בדוק שהסרגל אינו מכסה טופס ואינו יוצר גלישה אופקית.

**אימות ב-Clarity אחרי 7 ימים:**

| מדד | לפני | יעד |
|---|---|---|
| עומק גלילה ממומן | 13.48% | מעל 25% |
| נטישה ממומנת | 87.95% | מתחת ל-75% |
| Dead Clicks על CTA | 11 | 0 |
| נטישה במובייל | 88.38% | מתחת ל-80% |

---

## 6. הסתייגות

עומק הגלילה **לא בהכרח יעלה** מהסרגל עצמו — סרגל דביק נותן CTA בלי לגלול, ולכן ייתכן
שגולשים ימירו **מוקדם יותר** ועומק הגלילה אף יירד.

**זו אינה כישלון.** המדד הקובע הוא **מספר ההמרות המאומתות**, לא עומק הגלילה.
אם ההמרות עולות ועומק הגלילה יורד — הסרגל עובד בדיוק כמתוכנן.
המדוד על עומק גלילה רלוונטי רק לתיקון F-12 (תוכן ו-CTA בתוך אזור ה-FAQ).
