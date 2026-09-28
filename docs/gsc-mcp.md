# Google Search Console MCP — הקמה ועבודה מ-VS Code

שרת MCP מקומי שנותן ל-Claude Code גישה ישירה לנתוני Search Console של
`teleco.co.il` ו-`מרכזיות-טלפונים.org.il`. השרת רץ **על המכונה שלך**, מדבר ישירות
עם Google API דרך Service Account, ולא עובר דרך שום צד שלישי.

החבילה: [`mcp-server-gsc`](https://www.npmjs.com/package/mcp-server-gsc) (MIT), מוצמדת
לגרסה 0.3.0 ב-[`.mcp.json`](../.mcp.json). `npx` מוריד אותה בהפעלה הראשונה.

## הקמה (פעם אחת, כ-10 דקות)

### 1. Google Cloud — פרויקט ו-API

1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/) עם החשבון
   שמנהל את Search Console.
2. צור פרויקט חדש (למשל `gsc-mcp`) או בחר קיים.
3. **APIs & Services → Library** → חפש **Google Search Console API** → **Enable**.

### 2. Service Account ומפתח

1. **APIs & Services → Credentials → Create credentials → Service account**.
2. שם: `gsc-mcp`. תפקיד (Role) לא נדרש — השאר ריק ולחץ **Done**.
3. פתח את ה-Service Account → לשונית **Keys → Add key → Create new key → JSON**.
   קובץ בשם `gsc-mcp-xxxxxx.json` יורד למחשב.
4. העתק את כתובת המייל של ה-Service Account
   (`gsc-mcp@<project>.iam.gserviceaccount.com`) — צריך אותה בשלב הבא.

### 3. הרשאה ב-Search Console (לכל נכס בנפרד)

1. [Search Console](https://search.google.com/search-console) → בחר נכס →
   **Settings → Users and permissions → Add user**.
2. הדבק את מייל ה-Service Account. הרשאה: **Full** (נדרש ל-`index_inspect`
   ול-`submit_sitemap`; ל-דוחות בלבד מספיק **Restricted**).
3. חזור על זה גם ל-`teleco.co.il` וגם ל-`מרכזיות-טלפונים.org.il`.

### 4. התקנת המפתח בריפו ובדיקה

```bash
./scripts/setup-gsc-mcp.sh ~/Downloads/gsc-mcp-xxxxxx.json
```

הסקריפט מעתיק את המפתח ל-`.secrets/gsc-service-account.json` (תיקייה שמוחרגת
ב-`.gitignore`), נועל אותו להרשאות 600, ואז מריץ בדיקה מלאה: חתימת JWT, קבלת
טוקן, קריאה ל-API ואימות ששני הנכסים נראים. בדיקה חוזרת בכל שלב:

```bash
./scripts/setup-gsc-mcp.sh --check
```

רוצה לשמור את המפתח מחוץ לריפו? `export GSC_CREDENTIALS_FILE=/path/key.json`
בפרופיל ה-shell — גם `.mcp.json` וגם הסקריפט מכבדים את זה.

### 5. הפעלה ב-VS Code

פתח את הריפו ב-VS Code והתחל סשן Claude Code. בפעם הראשונה Claude Code שואל
אם לאשר את שרתי ה-MCP מ-`.mcp.json` של הפרויקט — אשר את `gsc`. הקלד `/mcp`
לוודא שהוא במצב connected.

הסשן הזה, כולל שרת ה-MCP, ממשיך לעבוד גם מהנייד דרך Remote Control
(ראה [README](../README.md)) — השרת רץ על המכונה שלך והנייד הוא רק חלון אליו.

## הכלים שהשרת חושף

| כלי | מה עושה |
|---|---|
| `list_sites` | כל הנכסים שה-Service Account רואה |
| `search_analytics` | ביצועי חיפוש: שאילתות, עמודים, מדינות, מכשירים, תאריכים, עד 25,000 שורות |
| `enhanced_search_analytics` | כנ"ל + פילטרי regex + זיהוי quick wins בתוך אותה קריאה |
| `detect_quick_wins` | שאילתות במיקומים 4–20 עם הרבה חשיפות ו-CTR נמוך |
| `index_inspect` | מצב אינדוקס של URL בודד (כמו URL Inspection ב-Search Console) |
| `list_sitemaps` / `get_sitemap` / `submit_sitemap` | ניהול sitemaps |

### מזהה הנכס (`siteUrl`)

הפורמט תלוי בסוג הנכס ב-Search Console. `list_sites` מחזיר את הצורה המדויקת:

| סוג נכס | דוגמה |
|---|---|
| Domain property | `sc-domain:teleco.co.il` |
| URL-prefix property | `https://teleco.co.il/` (כולל הסלאש בסוף) |
| דומיין עברי | Google מחזיר punycode: `sc-domain:xn--...org.il` — השתמש במה ש-`list_sites` מחזיר |

### דוגמאות לבקשות בשיחה

* "תביא לי את 50 השאילתות המובילות ל-teleco.co.il ב-28 הימים האחרונים לפי קליקים"
* "quick wins ל-מרכזיות-טלפונים.org.il: מיקום 5–15, מעל 200 חשיפות"
* "אילו עמודים ב-teleco.co.il איבדו קליקים ברבעון הזה לעומת הקודם?"
* "בדוק אם `https://teleco.co.il/fiber/` מאונדקס"
* "השווה מובייל מול דסקטופ בשאילתות שמכילות 'מרכזייה'"

## אבטחה

* המפתח יושב רק ב-`.secrets/` שמוחרג מ-git. **לעולם לא לקמט** אותו, לא להעלות
  לצ'אט ולא לשלוח במייל.
* ה-Service Account מקבל גישה **רק** לנכסי Search Console שהוספת אותו אליהם. הוא
  לא רואה Gmail, Drive, Ads או Analytics.
* מפתח דלף? Google Cloud → Service Accounts → Keys → מחק את המפתח, צור חדש,
  הרץ שוב `setup-gsc-mcp.sh`.
* Search Console API מוגבל לכ-1,200 קריאות לדקה לפרויקט — לעבודה יומיומית זה
  בלתי מורגש.

## פתרון תקלות

| הודעה | סיבה ותיקון |
|---|---|
| `token exchange failed (400): Invalid grant` | המפתח נמחק ב-Google Cloud, או שעון המחשב לא מסונכרן. צור מפתח חדש. |
| `Search Console API returned 403` | ה-API לא מופעל בפרויקט שהמפתח שייך אליו. שלב 1.3. |
| `X is NOT visible to gsc-mcp@...` | ה-Service Account לא נוסף כמשתמש בנכס. שלב 3. |
| `0 properties visible` | כנ"ל, לאף נכס. |
| `/mcp` מראה `gsc` failed | הרץ `./scripts/setup-gsc-mcp.sh --check`; אם עובר, הרץ `/mcp` → reconnect. בדוק ש-`node -v` הוא 18 ומעלה. |
| `index_inspect` מחזיר 403 | הרשאת Restricted לא מספיקה; העלה ל-Full בנכס. |
