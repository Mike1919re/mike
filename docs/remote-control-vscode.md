# Remote Control בתוסף VS Code — מדריך מלא

## הפעלה

בתיבת הפרומפט של Claude Code ב-VS Code הקלד `/remote-control` או `/rc`, או פתח את
תפריט הפקודות עם `/` ובחר בפקודה. באנר עם מצב החיבור מופיע מעל תיבת הפרומפט,
ו-Claude Code גם מפרסם את כתובת הסשן בשיחה.

לניתוק: לחיצה על אייקון הסגירה בבאנר, או הרצה חוזרת של `/remote-control`.

### מה התוסף לא עושה, בניגוד ל-CLI

* **אין ארגומנט שם.** ב-CLI אפשר `claude --remote-control "My Project"`; בתוסף לא.
  שם הסשן נגזר מהיסטוריית השיחה או מהפרומפט הראשון.
* **אין QR code.** להתחברות מהנייד: פתח את הסשן מרשימת הסשנים באפליקציית Claude
  (לשונית **Code**), או שלח לעצמך את הקישור מהבאנר.
* **אין `--verbose`, `--sandbox`, `--no-sandbox`.**
* **אין מצב שרת.** מצב שרת (`claude remote-control`, כמה סשנים במקביל מתהליך אחד)
  קיים רק ב-CLI. בתוסף — סשן מרוחק אחד לכל תהליך.

### חיבור אוטומטי לכל הסשנים

בתוסף: **Enable Remote Control for all sessions** בקטע Settings של תפריט הפקודות
(דורש Claude Code v2.1.203 ומעלה). לחלופין — הסקריפט בריפו הזה, שכותב
`remoteControlAtStartup: true` ל-`~/.claude/settings.json`.

## חיים עם החיבור

**הסשן חייב להישאר חי.** אם סוגרים את VS Code, הסשן יורד. אין כאן מקבילה
ל-`claude remote-control --continue` מה-CLI — כדי להחזיר שיחה שהיה עליה Remote
Control, פשוט פותחים אותה מחדש בתוסף, ו-Claude Code מתחבר חזרה לסשן הקיים
ב-claude.ai במקום להוסיף אחד חדש לרשימה.

**שם הסשן** נקבע לפי הסדר: שם שנקבע ב-`/rename` ← ההודעה המשמעותית האחרונה בשיחה
← שם אוטומטי כמו `myhost-graceful-unicorn`. שינוי שם מ-claude.ai או מהאפליקציה
מעדכן גם את השם המקומי.

**נפילת רשת.** בסשן אינטראקטיבי Claude Code מנסה להתחבר מחדש לכל אורך הנתק וחוזר
מעצמו כשהרשת חוזרת. אפשר להמשיך לעבוד מקומית בינתיים.

**403 מהרשת.** אחרי החיבור, Claude Code ממשיך לנסות עד שלוש דקות מול 403 — קורה
אחרי מעבר VPN. נמשך יותר? הוא מתנתק ומציין מה סירב: קצה רשת, או פרוקסי/VPN/פיירוול
ברשת שלך.

## מה עובד מהנייד ומהדפדפן

פקודות שרצות רק בטרמינל — כמו `/plugin` ו-`/resume` — לא זמינות משם. כן עובדות:

* פלט טקסט: `/compact`, `/clear`, `/context`, `/usage`, `/exit`, `/recap`,
  `/reload-plugins`, `/usage-credits`
* עם ארגומנט במקום בורר: `/model sonnet`, `/effort high`, `/fast`, `/color`, `/rename`
* `/mcp` — מהאפליקציה מחזיר סיכום טקסטואלי של מצב השרתים; `reconnect`, `enable`,
  `disable` עובדים משני המשטחים
* `/config` — מהאפליקציה `key=value` לקביעת הגדרה, בלי ארגומנט מקבלים רשימת מפתחות;
  בדפדפן פותח את הגדרות Claude Code
* `/autocompact 500k` — עם ארגומנט; בלי ארגומנט מדפיס את הגודל הנוכחי

**קבצים ותמונות.** אפשר לצרף תמונה או קובץ מהאפליקציה או מ-claude.ai/code. תמונות
נראות ישירות; קבצים אחרים יורדים למכונה שלך ומועברים כהפניות `@`.

## התראות פוש לנייד

הרץ `/config` והדלק **Push when Claude decides** (משימות ארוכות שהסתיימו) או
**Push when actions required** (בקשות הרשאה ושאלות), או שניהם. אפשר גם לבקש בפרומפט:
"תודיע לי כשהטסטים נגמרים".

Claude Code מדלג על פוש כשאתה מקליד בטרמינל המחובר. להרחבה לכל זמן שאתה ליד המכונה,
גם בחלון אחר: הגדר `CLAUDE_CLIENT_PRESENCE_FILE` לנתיב קובץ סימון — כל עוד הקובץ
קיים, אין פוש.

לא מגיעות התראות? אם `/config` מציג **No mobile registered**, פתח את האפליקציה בנייד
כדי לרענן את הטוקן. ב-iOS מצבי Focus וסיכומי התראות משהים פוש; ב-Android חסכון
סוללה אגרסיבי מעכב — הוצא את Claude מאופטימיזציית הסוללה.

## אבטחה

הסשן המקומי מבצע רק בקשות HTTPS יוצאות ולא פותח פורטים נכנסים. כל התעבורה עוברת
ב-TLS דרך Anthropic API, עם כמה אישורים קצרי-חיים שכל אחד מוגבל למטרה אחת.

בזמן שהחיבור פעיל, תמליל הסשן — ההודעות שלך, התשובות, ופעילות הכלים — נשמר בשרתי
Anthropic כדי לסנכרן בין המכשירים ולאפשר התאוששות מנתק. ההרצה והגישה לקבצים נשארות
אצלך. לכיבוי מוחלט: ההגדרה `disableRemoteControl`. ארגונים עם דרישת Zero Data
Retention אינם יכולים להפעיל Remote Control.

## פתרון תקלות לפי הודעה

| ההודעה | הסיבה | התיקון |
|---|---|---|
| `requires a claude.ai subscription` | לא מחובר לחשבון claude.ai, או `ANTHROPIC_API_KEY` מוגדר | `unset ANTHROPIC_API_KEY` ואז `claude auth login` |
| `requires a full-scope login token` | טוקן מ-`claude setup-token` או `CLAUDE_CODE_OAUTH_TOKEN` | `claude auth login` לטוקן סשן מלא |
| `Unable to determine your organization` | פרטי חשבון מטמון ישנים | `claude auth login` |
| `isn't enabled for this account` | זכאויות מטמון לא מעודכנות אחרי שינוי תוכנית | `claude auth logout` ואז `claude auth login`; `claude doctor` לפירוט |
| `Couldn't verify Remote Control eligibility` | לא הגיע לשירות דגלי הפיצ'רים — אופליין או פרוקסי חוסם | נסה שוב עם רשת; `claude doctor` |
| `requires feature-flag evaluation` | אחד מ-`DISABLE_TELEMETRY` / `DO_NOT_TRACK` / `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` / `DISABLE_GROWTHBOOK` | בטל את המשתנה שההודעה מציינת, גם בבלוק `env` של settings.json |
| `only available when using Claude via api.anthropic.com` | Bedrock / Vertex / Foundry, או `ANTHROPIC_BASE_URL` מותאם | ההודעה נוקבת במשתנה — בטל אותו והפעל מחדש |
| `disabled by your organization's policy` | אם מוזכר `disableRemoteControl` — מדיניות מנוהלת במכשיר; אחרת המתג הארגוני כבוי | Owner מדליק ב-claude.ai/admin-settings/claude-code |
| `due to its compliance policy` | מדיניות שמירת נתונים לא תואמת; המתג אפור בפאנל | פנייה לתמיכת Anthropic |
| `Remote credentials fetch failed` | לא מחובר, או פיירוול/פרוקסי חוסם HTTPS יוצא בפורט 443 | `claude auth login`; בדוק חסימות רשת |
| `Couldn't reconnect to your Remote Control session` | כשל זמני בחיבור מחדש — רשת או שגיאת שרת | `/remote-control` לניסיון חוזר |
| `Previous session is unavailable` | לא ניתן להחזיר את הסשן הקודם | `/remote-control` לסשן חדש; הודעות קודמות לא יעברו אליו |
| `got an unexpected server response` | הגרסה לא יודעת לקרוא את תשובת השרת | `claude update` ואז `/remote-control` |
| `this device is not enrolled` | הארגון דורש Trusted Devices | `/login` — הרישום קורה כחלק מההתחברות |
| `session expired for trusted-device check` | ההתחברות בת יותר מ-18 שעות | `/login`, או אישור ב-Face ID / Touch ID / Windows Hello / passkey |

## Remote Control מול Claude Code on the web

שניהם משתמשים באותו ממשק ב-claude.ai/code. ההבדל הוא איפה הסשן רץ:
Remote Control רץ על המכונה שלך, ולכן שרתי ה-MCP המקומיים, הכלים והגדרות הפרויקט
זמינים. Claude Code on the web רץ בענן.

Remote Control — כשאתה באמצע עבודה מקומית ורוצה להמשיך ממכשיר אחר.
Claude Code on the web — כשאתה רוצה להתחיל משימה בלי הקמה מקומית, לעבוד על ריפו
שלא משוכפל אצלך, או להריץ כמה משימות במקביל.
