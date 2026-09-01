# Remote Control — הקמה ל-VS Code

הפעלת [Remote Control](https://code.claude.com/docs/en/remote-control) על סשן Claude Code
שרץ בתוסף VS Code, כך שאפשר להמשיך אותו מהנייד או מכל דפדפן דרך
[claude.ai/code](https://claude.ai/code).

הסשן ממשיך לרוץ **על המכונה שלך**. הרצת הקוד, הגישה לקבצים, שרתי ה-MCP והגדרות
הפרויקט נשארים מקומיים — הדפדפן והנייד הם רק חלון אל הסשן הזה.

## התחלה מהירה

```bash
./scripts/enable-remote-control.sh --check   # אבחון בלבד, לא כותב כלום
./scripts/enable-remote-control.sh           # אבחון + הדלקת חיבור אוטומטי
./scripts/enable-remote-control.sh --off     # כיבוי החיבור האוטומטי
```

ואז ב-VS Code: בתיבת הפרומפט של Claude Code הקלד `/remote-control` (או `/rc`).
מעל התיבה יופיע באנר עם מצב החיבור; לחיצה על **claude.ai/code** בתוכו פותחת את הסשן.

## למה ההגדרה לא יושבת בריפו

`remoteControlAtStartup` מדליק Remote Control אוטומטית בכל סשן אינטראקטיבי.
בהגדרות פרויקט או לוקאל (`.claude/settings.json`, `.claude/settings.local.json`)
Claude Code **מכבד `false` אבל מתעלם מ-`true`** — כדי שקובץ מקומיט לא ידליק
Remote Control לכל מי שמושך את הריפו.

לכן הסקריפט כותב את ההגדרה ל-`~/.claude/settings.json` (הגדרות המשתמש), עם גיבוי
ל-`~/.claude/settings.json.bak`. אין כאן `.claude/settings.json` בכוונה — קובץ כזה
היה נראה כאילו הוא עושה משהו בלי לעשות כלום.

החיבור האוטומטי מזדהה עם חשבון ה-claude.ai שלך, כך שהסשן מופיע רק אצלך.

## מה הסקריפט בודק

| בדיקה | מה חוסם |
|---|---|
| הזדהות | `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` — שניהם לא תומכים ב-Remote Control |
| נקודת קצה | `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `ANTHROPIC_BASE_URL` שאינו `api.anthropic.com` |
| דגלי פיצ'רים | `DISABLE_TELEMETRY`, `DO_NOT_TRACK`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_GROWTHBOOK` |
| מדיניות | `disableRemoteControl: true` או `remoteControlAtStartup: false` בקבצי הגדרות מקומיים ומנוהלים |

מה שהסקריפט **לא** יכול לבדוק מהמכונה: המתג הארגוני. ב-Team ו-Enterprise הוא כבוי
כברירת מחדל, ורק Owner מדליק אותו ב-[claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code).
לפירוט בדיקה-בדיקה הרץ `claude doctor`.

## עוד

* [docs/remote-control-vscode.md](docs/remote-control-vscode.md) — מגבלות התוסף, פקודות
  שעובדות מהנייד, התראות פוש, ופתרון תקלות לפי הודעת השגיאה.
* דרישות: מנוי Pro / Max / Team / Enterprise. מפתחות API אינם נתמכים.
