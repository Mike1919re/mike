#!/usr/bin/env bash
# enable-remote-control.sh
#
# Diagnoses Remote Control eligibility blockers and (optionally) turns on
# auto-connect for every interactive Claude Code session.
#
#   ./scripts/enable-remote-control.sh          # diagnose + enable auto-connect
#   ./scripts/enable-remote-control.sh --check  # diagnose only, change nothing
#   ./scripts/enable-remote-control.sh --off    # turn auto-connect back off
#
# Auto-connect is written to the USER settings file (~/.claude/settings.json).
# It is deliberately NOT written to .claude/settings.json in this repo:
# Claude Code honours a `false` in project/local settings but IGNORES a `true`,
# so a committed file can never turn Remote Control on.

set -euo pipefail

SETTINGS="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
MODE="enable"
problems=0

case "${1:-}" in
  --check) MODE="check" ;;
  --off)   MODE="disable" ;;
  "")      ;;
  *) echo "usage: $0 [--check|--off]" >&2; exit 2 ;;
esac

say()  { printf '%s\n' "$*"; }
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; problems=$((problems + 1)); }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$*"; }

say ""
say "Remote Control preflight"
say "========================"

# 1. Authentication ---------------------------------------------------------
say ""
say "Authentication"
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  bad "ANTHROPIC_API_KEY is set. API keys cannot establish Remote Control sessions."
  say "        Fix: unset ANTHROPIC_API_KEY, then run 'claude auth login' and pick claude.ai."
else
  ok "ANTHROPIC_API_KEY is not set."
fi

if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  bad "CLAUDE_CODE_OAUTH_TOKEN is set. Setup tokens are model-request-only."
  say "        Fix: unset it, then run 'claude auth login' for a full-scope session token."
else
  ok "CLAUDE_CODE_OAUTH_TOKEN is not set."
fi

# 2. API endpoint -----------------------------------------------------------
say ""
say "API endpoint (Remote Control requires api.anthropic.com)"
endpoint_clean=1
for v in CLAUDE_CODE_USE_BEDROCK CLAUDE_CODE_USE_VERTEX; do
  if [ -n "$(eval "printf '%s' \"\${$v:-}\"")" ]; then
    bad "$v is set — the session is routed away from the Anthropic API."
    endpoint_clean=0
  fi
done
if [ -n "${ANTHROPIC_BASE_URL:-}" ] && [ "$ANTHROPIC_BASE_URL" != "https://api.anthropic.com" ]; then
  bad "ANTHROPIC_BASE_URL points at $ANTHROPIC_BASE_URL, not api.anthropic.com."
  say "        Fix: unset it, and remove it from the 'env' block in any settings.json."
  endpoint_clean=0
fi
[ "$endpoint_clean" -eq 1 ] && ok "No provider or gateway override found."

# 3. Feature-flag evaluation ------------------------------------------------
say ""
say "Feature-flag evaluation (Remote Control availability depends on it)"
flags_clean=1
for v in DISABLE_TELEMETRY DO_NOT_TRACK CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC DISABLE_GROWTHBOOK; do
  if [ -n "$(eval "printf '%s' \"\${$v:-}\"")" ]; then
    bad "$v is set — this disables the feature-flag check Remote Control needs."
    flags_clean=0
  fi
done
[ "$flags_clean" -eq 1 ] && ok "None of the feature-flag kill switches are set."

# 4. Policy / managed settings ---------------------------------------------
say ""
say "Policy"
found_policy=0
for f in /Library/Application\ Support/ClaudeCode/managed-settings.json \
         /etc/claude-code/managed-settings.json \
         "$SETTINGS" \
         ".claude/settings.json" \
         ".claude/settings.local.json"; do
  [ -f "$f" ] || continue
  if grep -q '"disableRemoteControl"[[:space:]]*:[[:space:]]*true' "$f" 2>/dev/null; then
    bad "disableRemoteControl is true in $f"
    found_policy=1
  fi
  if grep -q '"remoteControlAtStartup"[[:space:]]*:[[:space:]]*false' "$f" 2>/dev/null; then
    warn "remoteControlAtStartup is false in $f (auto-connect stays off from there)."
    found_policy=1
  fi
done
[ "$found_policy" -eq 0 ] && ok "No local policy file blocks Remote Control."
say "        Note: the org-wide toggle lives at claude.ai/admin-settings/claude-code"
say "        and cannot be checked from this machine."

# 5. Apply ------------------------------------------------------------------
say ""
if [ "$MODE" = "check" ]; then
  say "Check-only mode: nothing was written."
else
  want=true
  [ "$MODE" = "disable" ] && want=false

  mkdir -p "$(dirname "$SETTINGS")"
  [ -f "$SETTINGS" ] || printf '{}\n' > "$SETTINGS"
  cp "$SETTINGS" "$SETTINGS.bak"

  if command -v python3 >/dev/null 2>&1; then
    WANT="$want" SETTINGS="$SETTINGS" python3 - <<'PY'
import json, os
path, want = os.environ["SETTINGS"], os.environ["WANT"] == "true"
try:
    with open(path) as fh:
        data = json.load(fh)
except (ValueError, FileNotFoundError):
    raise SystemExit(f"could not parse {path} as JSON — left unchanged (backup at {path}.bak)")
if not isinstance(data, dict):
    raise SystemExit(f"{path} is not a JSON object — left unchanged")
data["remoteControlAtStartup"] = want
with open(path, "w") as fh:
    json.dump(data, fh, indent=2)
    fh.write("\n")
PY
  elif command -v jq >/dev/null 2>&1; then
    jq --argjson v "$want" '.remoteControlAtStartup = $v' "$SETTINGS.bak" > "$SETTINGS"
  else
    say "Neither python3 nor jq is available. Set this by hand in $SETTINGS:"
    say "  \"remoteControlAtStartup\": $want"
    exit 1
  fi

  say "Wrote remoteControlAtStartup=$want to $SETTINGS (backup: $SETTINGS.bak)"
fi

say ""
if [ "$problems" -gt 0 ]; then
  say "$problems blocker(s) found above. Run 'claude doctor' for the per-check detail."
  exit 1
fi
say "No blockers found."
say ""
say "Next, in VS Code: open the Claude Code prompt box and type /remote-control"
say "(or /rc). A banner appears above the prompt box; click claude.ai/code in it,"
say "or find the session at https://claude.ai/code."
