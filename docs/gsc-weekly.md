# רוטינת Search Console שבועית — ימי חמישי, על המחשב שלך

הרוטינה רצה **רק על המכונה שלך**, כשהיא דלוקה. שום דבר לא רץ בענן, ומפתח
ה-Service Account לא עוזב את המחשב. אם המחשב כבוי ביום חמישי בשעה שנקבעה, הריצה
של אותו שבוע מתבטלת (ב-Mac: אם המחשב רק ישן, launchd מריץ בהתעוררות).

## מה הרוטינה עושה

1. [`scripts/gsc-weekly.mjs`](../scripts/gsc-weekly.mjs) מושך מ-Search Console את
   28 הימים האחרונים (נתונים סופיים, בפיגור של 3 ימים) ואת 28 הימים שלפניהם, לשני
   האתרים, וכותב דוח Markdown ל-`reports/gsc/<תאריך>.md`:
   * סיכום: קליקים, חשיפות, CTR, מיקום, והשינוי מהתקופה הקודמת
   * **עמודים חשובים** (לפי הביטויים ב-`gsc-weekly.config.json` + 5 העמודים המובילים)
     עם השאילתות הבולטות של כל אחד
   * **Quick wins**: שאילתות במיקום 4–20 עם ≥100 חשיפות ו-CTR נמוך מהצפוי למיקום,
     מדורגות לפי קליקים פוטנציאליים
   * **עמודים בירידה**: ≥25% פחות קליקים מהתקופה הקודמת
   * **קניבליזציה**: שאילתה שבה שני עמודים ויותר חולקים את החשיפות
   * שאילתות מובילות ופילוח מכשירים
2. [`scripts/gsc-weekly.sh`](../scripts/gsc-weekly.sh) מריץ את הסקריפט, ואם ה-CLI
   `claude` מותקן, מעביר לו את הדוח ומצרף לסופו קטע **"המלצות לשבוע"** בעברית:
   פעולות מהירות מדורגות לפי קליקים צפויים, עם title ו-meta description מוצעים,
   ירידות לבדיקה, החלטות קניבליזציה, ומה לעקוב אחריו.
3. ב-Mac קופצת התראה עם נתיב הדוח. לוג ב-`reports/gsc/weekly.log`.

`reports/` מוחרג מ-git. הדוחות נשארים מקומיים; אם תרצה היסטוריה בריפו, הסר את
השורה מ-`.gitignore`.

## התקנה (פעם אחת)

דרישות: המפתח מותקן (`./scripts/setup-gsc-mcp.sh --check` עובר), Node 18+,
ו-`claude` ב-PATH להמלצות (בלעדיו הדוח יוצא עם נתונים בלבד).

```bash
./scripts/install-gsc-weekly.sh            # כל יום חמישי 09:00
./scripts/install-gsc-weekly.sh 10:30      # שעה אחרת
./scripts/install-gsc-weekly.sh --status
./scripts/install-gsc-weekly.sh --uninstall
```

* **macOS**: נוצר launchd agent בשם `il.co.teleco.gsc-weekly` ב-`~/Library/LaunchAgents`.
* **Linux**: שורת crontab עם התג `# il.co.teleco.gsc-weekly`.
* **Windows** (PowerShell, מתוך תיקיית הריפו, דורש Git Bash):

  ```powershell
  schtasks /Create /SC WEEKLY /D THU /ST 09:00 /TN "il.co.teleco.gsc-weekly" /TR "bash '$PWD\scripts\gsc-weekly.sh'"
  ```

## הרצה ידנית (גם עכשיו)

```bash
./scripts/gsc-weekly.sh            # דוח + המלצות
./scripts/gsc-weekly.sh --no-ai    # דוח בלבד
node scripts/gsc-weekly.mjs --json # גם JSON גולמי לצד ה-Markdown
```

הדוח נפתח ב-VS Code (Markdown preview מציג טבלאות RTL בסדר). אפשר גם לבקש
מ-Claude בסשן: "קרא את הדוח האחרון ב-reports/gsc ותן המלצות" — זה בדיוק מה
שהרוטינה עושה אוטומטית.

## כוונון

הכול ב-[`gsc-weekly.config.json`](../gsc-weekly.config.json):

| מפתח | ברירת מחדל | משמעות |
|---|---|---|
| `sites[].importantPages` | ביטויי regex | עמודים שתמיד יופיעו בטבלת "עמודים חשובים" |
| `window.days` / `lagDays` | 28 / 3 | אורך התקופה ופיגור הנתונים של Google |
| `quickWins` | מיקום 4–20, ≥100 חשיפות | סף לזיהוי quick wins |
| `decline.minDropPct` | 25 | ירידה באחוזים שנחשבת משמעותית |
| `cannibalization.minSharePct` | 20 | נתח חשיפות מינימלי לעמוד כדי להיחשב "מתחרה" |
| `limits.*` | | אורך הטבלאות |

## תקלות

| תסמין | תיקון |
|---|---|
| `FAIL cannot read key` | `./scripts/setup-gsc-mcp.sh <key.json>` |
| `skip <site>: not visible` | הוסף את ה-Service Account לנכס ב-Search Console |
| הדוח ללא "המלצות לשבוע" | `claude` לא ב-PATH של launchd/cron. בדוק `which claude` והוסף את התיקייה ל-`for d in ...` ב-`gsc-weekly.sh`, או הרץ `claude -p` ידנית |
| לא רץ ביום חמישי | המחשב היה כבוי. ב-Mac: `launchctl kickstart -k gui/$(id -u)/il.co.teleco.gsc-weekly` מריץ עכשיו |
| `launchd.err.log` מראה `Operation not permitted` | ב-macOS תן ל-`bash` גישה לתיקייה (System Settings → Privacy → Files and Folders) או העבר את הריפו מחוץ ל-Documents/Desktop |
