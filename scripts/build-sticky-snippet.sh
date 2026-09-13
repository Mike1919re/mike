#!/usr/bin/env bash
# בונה סניפט אחד להדבקה (style + script) מתוך קבצי המקור,
# כדי ששני העותקים לא ייפרדו זה מזה.
set -euo pipefail
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../sticky-header-mobile" && pwd)"
out="$dir/sticky-header-mobile.snippet.html"

{
  echo "<!-- ================================================================="
  echo "     Sticky Header — Mobile only"
  echo "     נוצר אוטומטית מתוך sticky-header-mobile.css + sticky-header-mobile.js"
  echo "     ע\"י scripts/build-sticky-snippet.sh — אין לערוך קובץ זה ידנית."
  echo "     ================================================================= -->"
  echo "<style id=\"shm-style\">"
  cat "$dir/sticky-header-mobile.css"
  echo "</style>"
  echo "<script id=\"shm-script\">"
  cat "$dir/sticky-header-mobile.js"
  echo "</script>"
} > "$out"

echo "נבנה: $out"
