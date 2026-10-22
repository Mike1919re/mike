#!/usr/bin/env bash
# gsc-weekly.sh — the weekly Search Console routine (runs on your machine).
#
#   1. scripts/gsc-weekly.mjs pulls 28 days from Search Console -> reports/gsc/<date>.md
#   2. if the `claude` CLI is installed, Claude reads the report and appends a
#      Hebrew "המלצות לשבוע" section: concrete title/meta/content fixes, ranked
#      by expected traffic gain, for the important pages.
#   3. the report path is printed; on macOS a notification pops up.
#
#   ./scripts/gsc-weekly.sh              # full run
#   ./scripts/gsc-weekly.sh --no-ai      # data only, skip Claude
#
# Scheduled for Thursdays by scripts/install-gsc-weekly.sh. Logs: reports/gsc/weekly.log

set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p reports/gsc
LOG="reports/gsc/weekly.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') gsc-weekly start"

# Scheduled runs (launchd/cron) have a minimal PATH; pick up node/claude anyway.
for d in /opt/homebrew/bin /usr/local/bin "$HOME/.nvm/versions/node"/*/bin "$HOME/.volta/bin" "$HOME/.local/bin" "$HOME/.claude/local" "$HOME/.npm-global/bin"; do
  [ -d "$d" ] && PATH="$d:$PATH"
done
export PATH

NO_AI=0; [ "${1:-}" = "--no-ai" ] && NO_AI=1

EXTRA=(); [ -n "${GSC_WEEKLY_FIXTURE:-}" ] && EXTRA=(--fixture "$GSC_WEEKLY_FIXTURE")   # offline test hook
REPORT="$(node scripts/gsc-weekly.mjs "${EXTRA[@]}")" || { echo "gsc-weekly: data pull failed (exit $?)"; exit 1; }
echo "report: $REPORT"

if [ "$NO_AI" -eq 0 ] && command -v claude >/dev/null 2>&1; then
  echo "asking Claude for recommendations..."
  PROMPT='אתה יועץ SEO בכיר לעסקי B2B בישראל. קיבלת דוח Search Console של 28 יום (Markdown, בעברית) לשני אתרים: teleco.co.il (טלקום אקספרט: קווי תמסורת סיב אופטי, מרכזייה בענן, טלפוניה לעסקים, SMS, מספרים וירטואליים, מוקדים) ו-מרכזיות-טלפונים.org.il.
כתוב בעברית בלבד קטע בשם "## המלצות לשבוע" ובו:
1. שלוש עד חמש פעולות מהירות (עד שבוע עבודה כל אחת) שיגדילו תנועה אורגנית לעמודים החשובים, מדורגות לפי קליקים צפויים. לכל פעולה: העמוד, השאילתות מהדוח שהיא מכוונת אליהן, מה בדיוק לשנות (title חדש מוצע עד 60 תווים, meta description מוצע עד 155 תווים, או שינוי תוכן/קישור פנימי ספציפי), ולמה לפי הנתונים.
2. ירידות שדורשות תשומת לב ומה לבדוק בכל אחת.
3. קניבליזציה: איזה עמוד להשאיר כעמוד הראשי לכל שאילתה ומה לעשות בשני.
4. מה לעקוב אחריו בשבוע הבא.
היה קונקרטי ומבוסס רק על מספרים שמופיעים בדוח. אל תמציא עמודים או שאילתות. בלי מבוא ובלי סיכום. פלט: Markdown בלבד.'
  if REC="$(claude -p "$PROMPT" --output-format text < "$REPORT" 2>>"$LOG")" && [ -n "$REC" ]; then
    { printf '\n---\n\n'; printf '%s\n' "$REC"; } >> "$REPORT"
    echo "recommendations appended"
  else
    echo "claude -p failed or returned nothing; report has data only"
  fi
elif [ "$NO_AI" -eq 0 ]; then
  echo "claude CLI not found on PATH; report has data only. Open it in VS Code and ask Claude for recommendations."
fi

if command -v osascript >/dev/null 2>&1; then
  osascript -e "display notification \"$REPORT\" with title \"דוח Search Console שבועי מוכן\"" >/dev/null 2>&1 || true
fi
echo "=== done: $REPORT"
echo "$REPORT"
