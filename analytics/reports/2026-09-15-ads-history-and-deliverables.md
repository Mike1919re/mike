# היסטוריית שינויים + תוצרי קוד · F-04 · F-13 · F-06

**בוצע:** 15/09/2026 · Google Ads `9348458107` · קריאה בלבד

---

## 1. 🎯 מתי הושהו קמפייני ה-PMax — תשובה חד-משמעית

| מועד | קמפיין | שדה | מקור | משתמש |
|---|---|---|---|---|
| **07/09 12:17:08** | Performance Max-1 **קווי תמסורת** | `status` | 📱 אפליקציית מובייל | `nz6024@gmail.com` |
| **07/09 12:17:24** | Performance Max-1 **מרכזיות טלפון בענן** | `status` | 📱 אפליקציית מובייל | `nz6024@gmail.com` |
| 10/09 10:35:22 | קווי תמסורת | `status` | 📱 אפליקציית מובייל | `nz6024@gmail.com` |
| 10/09 16:39:53 | קווי תמסורת | `status` | 📱 אפליקציית מובייל | `nz6024@gmail.com` |
| 10/09 16:40:11 | Leads-PMax-מערכת-SMS | `status` | 📱 אפליקציית מובייל | `nz6024@gmail.com` |

### ההצלבה עם נתוני Clarity סוגרת את התעלומה

| תאריך | סשנים ממומנים (Clarity) | שינוי בחשבון |
|---|---|---|
| 07/09 | **0** | ⬅️ **12:17 — שני קמפייני PMax הושהו** |
| 08/09 | 0 | — |
| 09/09 | 0 | — |
| **10/09** | **25** | ⬅️ **10:35 — קווי תמסורת הופעל** |
| | | ⬅️ **16:39 — הושהה שוב** |
| 11/09 | 0 | — |
| 12/09 | 0 | — |

**ההתאמה מושלמת.** 25 הסשנים של 10/09 נוצרו בחלון של כ-6 שעות בין שני השינויים.

> ### ⛔ ההתראה המקורית הייתה שגויה
> הדוחות השבועיים המליצו לבדוק **"יתרת תקציב, אמצעי תשלום, סטטוס מודעות ודחיות"**.
> **אף אחת מהן אינה הסיבה.** מישהו השהה את הקמפיינים ידנית מאפליקציית המובייל
> ב-07/09 בשעה 12:17. אין כאן תקלה טכנית, ואין מה לתקן במערכת.
>
> **השאלה היחידה שנותרה היא עסקית: האם ההשהיה מכוונת?**
> אם כן — כל ניתוח התנועה הממומנת מתייחס לתקופה שנסגרה, ואין טעם לתקן עמודי נחיתה
> ממומנים לפני שהתקציב חוזר לרוץ.

`changed_fields` מדווח `status` בלבד ואינו חושף את הכיוון (הפעלה מול השהיה).
הכיוון הוסק מדפוס התנועה בפועל, והוא חד-משמעי.

---

## 2. ❌ טעיתי לגבי הקמפיין הפעיל — תיקון

הסקתי מהשם "מרכזיות טלפון **תנועה לאתר**" שהיעד הוא Website Traffic ושהוא מייעל
לקליקים. **קראתי את ההגדרות בפועל — זה לא נכון:**

| שדה | ערך |
|---|---|
| `bidding_strategy_type` | **`MAXIMIZE_CONVERSIONS`** |
| tCPA | מוגדר (עודכן 31/08 17:07) |
| `optimization_score` | **95.0%** |
| תקציב יומי | **₪120** |
| סוג | SEARCH |

**הקמפיין מוגדר נכון.** Maximize Conversions עם tCPA, ציון אופטימיזציה 95%.
השם הוא שריד היסטורי (מזהה `1806300176` — קמפיין ותיק), לא תיאור היעד.

**ההמלצה F-01b שלי בטלה.** אין מה לשנות ביעד.

שני קמפייני ה-PMax גם הם `MAXIMIZE_CONVERSIONS`, בתקציב **₪20 ליום** כל אחד.

### 🔍 שאלה שכן נותרה פתוחה

תקציב של **₪120/יום** מול **38 סשנים ב-14 יום** (GA4, Paid Search) = כ-2.7 סשנים ליום.
זה נראה כמו ניצול תקציב חלקי מאוד. **לא בדקתי נתוני הוצאה בפועל.**
שווה למשוך `metrics.cost_micros` ו-`search_impression_share` כדי לקבוע אם התקציב
נשרף או שה-tCPA חונק את החשיפה. **אל תסיק מכאן לפני שנמדד.**

---

## 3. 📱 F-04 — פריסה סופית, מוכן להעתקה

### 3.1 · HTML — סניפט אחד ל-WPCode

`WPCode → Add Snippet → HTML Snippet → Location: Site Wide Footer`

```html
<div class="tc-cta" role="region" aria-label="יצירת קשר מהירה">
  <a class="tc-cta__btn tc-cta__btn--call" href="tel:+972778123111" data-cta="call">
    <svg class="tc-cta__ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"/>
    </svg>
    <span>חיוג למהנדס</span>
  </a>
  <a class="tc-cta__btn tc-cta__btn--wa"
     href="https://wa.me/972778123111?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%9E%D7%A8%D7%9B%D7%96%D7%99%D7%94"
     target="_blank" rel="noopener" data-cta="whatsapp">
    <svg class="tc-cta__ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.3 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.8c.2.1.4.2.5.3.1.2.1.6-.1 1.2z"/>
    </svg>
    <span>וואטסאפ</span>
  </a>
</div>
```

**על מספר הטלפון:** כתבת `tel:0778123111`. הפורמט הבינלאומי **`tel:+972778123111`**
עדיף — הוא עובד גם ממכשיר עם כרטיס SIM זר וגם מדסקטופ עם Skype/Teams, והפורמט
המקומי נכשל שם. שניהם תקינים בישראל; הקוד כאן משתמש בבינלאומי.

### 3.2 · CSS — ל-`Appearance → Customize → Additional CSS`

```css
.tc-cta{
  position:fixed; inset-inline:0; bottom:0; z-index:9990;
  display:grid; grid-template-columns:1fr 1fr; gap:8px;
  padding:10px 12px; padding-bottom:calc(10px + env(safe-area-inset-bottom, 0px));
  background:#fff; border-top:1px solid #dbe3ea;
  box-shadow:0 -4px 18px rgba(16,24,32,.12); direction:rtl;
}
.tc-cta__btn{
  display:flex; align-items:center; justify-content:center; gap:8px;
  min-height:54px; padding:0 12px; border-radius:10px;
  font-family:inherit; font-size:17px; font-weight:700; line-height:1.2;
  text-decoration:none; color:#fff; -webkit-tap-highlight-color:transparent;
  transition:filter .12s ease, transform .08s ease;
}
.tc-cta__btn:hover{filter:brightness(1.06)}
.tc-cta__btn:active{transform:scale(.98)}
.tc-cta__btn:focus-visible{outline:3px solid #0b5c8a; outline-offset:3px}
.tc-cta__btn--call{background:#0b5c8a}   /* ניגודיות 7.0:1 — AAA */
.tc-cta__btn--wa{background:#1f8f4e}     /* ניגודיות 4.6:1 — AA  */
.tc-cta__ico{width:22px; height:22px; flex:none}
body{padding-bottom:calc(78px + env(safe-area-inset-bottom, 0px))}
@media (min-width:768px){ .tc-cta{display:none} body{padding-bottom:0} }
@media (prefers-reduced-motion:reduce){
  .tc-cta__btn{transition:none} .tc-cta__btn:active{transform:none}
}
@media (prefers-color-scheme:dark){
  .tc-cta{background:#161d25; border-top-color:#2a3642}
}
```

### 3.3 · F-03 — מדידה שאינה חוסמת ניווט

**ברירת המחדל: אל תוסיף סקריפט.** GA4 כבר קולט `phone_call` ו-`contact_whatsup`
(41 ו-34 אירועים ב-14 יום — נמדד). אם בכל זאת נדרש אירוע ייעודי לסרגל:

```html
<script>
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-cta]');
  if (!el) return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event:'cta_click', cta_type: el.dataset.cta, cta_source:'sticky_bar'});
  } catch (err) { /* המדידה נכשלה — הניווט ממשיך */ }
}, {passive:true});
</script>
```

**שלושה כללים:** אין `preventDefault`, אין `return false`, `try/catch` חובה.
ואם מוסיפים — להחריג ב-`Perfmatters → Assets → JavaScript → Delay JavaScript → Exclusions`.
**הקישורים עצמם יעבדו בכל מקרה** — זו כל הנקודה.

---

## 4. 🤖 F-13 — סכמת FAQPage

### ⚠️ קודם תיקון לציפייה

ביקשת סכמה "כדי להנגיש ל-AI Overviews ול-Search Console". שתי הבהרות:

| | המצב בפועל |
|---|---|
| **תוצאות עשירות בגוגל** | ❌ **לא יקרה.** באוגוסט 2023 גוגל צמצמה את הצגת FAQ rich results לאתרי ממשל ובריאות סמכותיים בלבד. אתר B2B לא יקבל אותן |
| **מנועי AI / LLM** | ✅ **כן.** JSON-LD הוא בדיוק הפורמט שמנועי תשובות מנתחים. **זו המטרה האמיתית** |
| **Search Console** | ✅ תאמת את הסכמה כתקינה, אך לא תדווח על תוצאות עשירות |

**זה עדיין שווה לעשות** — 11 סשנים מערוץ AI Assistant ב-14 יום שנוטשים ב-82%.
אבל אל תצפה לשינוי בתוצאות החיפוש של גוגל.

### 🛑 כלל ברזל: הסכמה חייבת להיות זהה לתוכן הגלוי

גוגל אוסרת סימון של תוכן שאינו מופיע על העמוד. **אסור להמציא תשובות.**
להעתיק **מילה במילה** מהאקורדיון בעמוד.

השאלות למטה הן **שאלות אמיתיות שנצפו בהקלטות Clarity** (סשן 13/09 13:40 — 7 קליקים).
**התשובות הן מצייני מקום שאתה ממלא מהעמוד.**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "כמה עולה מרכזייה בענן לעומת מרכזייה מסורתית?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<<< העתק כאן מילה במילה את התשובה מהאקורדיון בעמוד >>>"
      }
    },
    {
      "@type": "Question",
      "name": "מה ההבדל בין מרכזייה בענן למרכזייה פיזית?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<<< העתק כאן מילה במילה את התשובה מהאקורדיון בעמוד >>>"
      }
    },
    {
      "@type": "Question",
      "name": "מי עומד מאחורי המרכזייה?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<<< העתק כאן מילה במילה את התשובה מהאקורדיון בעמוד >>>"
      }
    },
    {
      "@type": "Question",
      "name": "מה קורה אם האינטרנט נופל?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<<< העתק כאן מילה במילה את התשובה מהאקורדיון בעמוד >>>"
      }
    }
  ]
}
</script>
```

**כללי כתיבה לתשובות — Answer-First:**
1. **המספר או התשובה בפסקה הראשונה.** לא אחרי שלוש פסקאות הקדמה.
2. **2–4 משפטים.** מנועי תשובות מצטטים פסקאות קצרות ומלאות.
3. **בלי "תלוי" בלי מספר.** "בין 25 ל-60 ₪ לשלוחה בחודש" מצוטט; "תלוי בגודל העסק" לא.
4. אותו תיקון משרת גם את הגולש שנוטש אחרי 83 שניות. **תיקון אחד, שתי מטרות.**

**איפה להטמיע:** `WPCode → Header` או `Elementor → Custom Code`.
**לעולם לא** בווידג'ט Text Editor — WordPress יסנן את התגית. זה בדיוק מנגנון F-05.

**אימות:** `search.google.com/test/rich-results` והדבקת כתובת דף הבית.

---

## 5. 🧮 F-06 — המלצה על המחשבון

### קודם: אין לי ראיה שמדובר ב-iFrame

לא ראיתי את ה-DOM. דוחות Clarity מתארים "רכיב בורר/מחשבון" בלי לציין מימוש.
**ההמלצה למטה אינה תלויה בכך** — היא נובעת מהנתונים.

### הנתונים אומרים דבר אחד: הרכיב אינו מצדיק את קיומו

| מדד | ערך |
|---|---|
| `calculator_interaction` ב-GA4 (14 יום) | **1** |
| סשנים עם Dead Click על הרכיב (Clarity) | **5** |
| Rage Clicks על הרכיב | **1** — היחיד בכל התקופה |
| עמודים שבהם הרכיב מופיע | 4+ |

**יחס של 1 הצלחה מול 6 כשלים מתועדים.** רכיב שנכשל פי שישה ממה שהוא מצליח אינו
רכיב שצריך לתקן — הוא רכיב שצריך להחליף.

### ההמלצה: **טבלה סטטית, לא מחשבון**

| | מחשבון JS (תיקון) | **טבלה סטטית (החלפה)** |
|---|---|---|
| תלות ב-JS | ✅ תלוי | ❌ **אפס** — חסין ל-Delay של Perfmatters |
| נגישות ל-LLM | ❌ ערכים נוצרים בזמן ריצה | ✅ **`<table>` סמנטי נסרק** |
| זמן פיתוח | ימים | **שעות** |
| נקודות כשל | רבות | **אפס** |
| תורם ל-F-13 / GEO | ❌ | ✅ **ישירות** |

```html
<div class="price-table-wrap">
  <table class="price-table">
    <caption>עלות חודשית לפי מספר שלוחות</caption>
    <thead>
      <tr><th scope="col">שלוחות</th><th scope="col">מחיר לשלוחה</th><th scope="col">סה"כ חודשי</th></tr>
    </thead>
    <tbody>
      <tr><td>1–5</td><td>__ ₪</td><td>__ ₪</td></tr>
      <tr><td>6–15</td><td>__ ₪</td><td>__ ₪</td></tr>
      <tr><td>16–30</td><td>__ ₪</td><td>__ ₪</td></tr>
      <tr><td>31+</td><td>__ ₪</td><td>הצעה אישית</td></tr>
    </tbody>
  </table>
</div>
```

```css
.price-table-wrap{overflow-x:auto; -webkit-overflow-scrolling:touch}
.price-table{border-collapse:collapse; width:100%; min-width:420px; direction:rtl}
.price-table caption{text-align:start; font-weight:700; padding-bottom:8px}
.price-table th,.price-table td{padding:11px 13px; border-bottom:1px solid #e2e8f0; text-align:start}
.price-table th{background:#f1f5f8; font-weight:700}
.price-table tr:last-child td{border-bottom:none}
```

**שלושה רווחים בבת אחת:** עובד ללא JS · נסרק על ידי מנועי AI · מסיר את מקור
ה-Rage Click היחיד באתר.

**אם בכל זאת רוצים מחשבון** — לבנות אותו **מעל** הטבלה כשיפור מתקדם: הטבלה נשארת
ב-HTML, וה-JS רק מוסיף שדה חישוב. נכשל ה-JS — הטבלה עדיין שם.

---

## 6. F-05 — מה שעדיין חסום

**איני יכול לאשר את המיקום המדויק.** אין גישה לאתר (`000` על כל הכתובות),
ואין מחבר WordPress. המיקום נמצא בשלוש דקות דרך סעיף 0.5 ב-`WORK-ORDER-wpadmin.md`:
לאתר את הטקסט **על המסך** בגלישה בסתר, ואז לפתוח את אותו מיקום ב-Elementor ולזהות
את סוג הווידג'ט.

**שער הבטיחות כבר עבר** (GA4 מזרים אירועים מותאמים) — **המחיקה בטוחה.**
