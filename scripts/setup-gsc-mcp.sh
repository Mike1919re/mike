#!/usr/bin/env bash
# setup-gsc-mcp.sh
#
# Installs the Google service-account key that the Search Console MCP server
# (.mcp.json -> "gsc") needs, then verifies the connection end to end.
#
#   ./scripts/setup-gsc-mcp.sh ~/Downloads/my-project-abc123.json   # install key + verify
#   ./scripts/setup-gsc-mcp.sh --check                               # verify only
#
# The key is copied to .secrets/gsc-service-account.json inside this repo.
# .secrets/ is git-ignored, so the key never leaves your machine or reaches GitHub.
# To keep the key elsewhere, export GSC_CREDENTIALS_FILE=/path/key.json instead;
# .mcp.json and gsc-check.mjs both honour it.

set -euo pipefail

cd "$(dirname "$0")/.."
DEST_DIR=".secrets"
DEST="$DEST_DIR/gsc-service-account.json"
TARGET="${GSC_CREDENTIALS_FILE:-$DEST}"

say()  { printf '%s\n' "$*"; }
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*" >&2; }

usage() { say "usage: $0 <downloaded-service-account-key.json> | --check" >&2; exit 2; }

case "${1:-}" in
  --check) MODE="check" ;;
  "")      usage ;;
  -*)      usage ;;
  *)       MODE="install"; SRC="$1" ;;
esac

say ""
say "Search Console MCP setup"
say "========================"

# 1. Runtime -----------------------------------------------------------------
say ""
say "Runtime"
if ! command -v node >/dev/null 2>&1; then
  bad "node is not installed. mcp-server-gsc needs Node.js 18+ (https://nodejs.org)."
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  bad "node $(node -v) is too old; mcp-server-gsc needs 18 or newer."
  exit 1
fi
ok "node $(node -v)"
command -v npx >/dev/null 2>&1 && ok "npx available" || { bad "npx not found"; exit 1; }

# 2. Install key -------------------------------------------------------------
if [ "$MODE" = "install" ]; then
  say ""
  say "Key file"
  [ -f "$SRC" ] || { bad "no such file: $SRC"; exit 1; }
  if ! node -e 'const k=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(k.type!=="service_account"||!k.private_key||!k.client_email||!k.token_uri) process.exit(1)' "$SRC"; then
    bad "$SRC is not a Google service-account key (expected type=service_account with client_email and private_key)."
    say "        Google Cloud Console -> IAM & Admin -> Service Accounts -> Keys -> Add key -> JSON"
    exit 1
  fi
  mkdir -p "$(dirname "$TARGET")"
  if [ -f "$TARGET" ] && ! cmp -s "$SRC" "$TARGET"; then
    cp "$TARGET" "$TARGET.bak"
    say "        Existing key backed up to $TARGET.bak"
  fi
  cp "$SRC" "$TARGET"
  chmod 600 "$TARGET"
  ok "key installed at $TARGET (mode 600)"
  if git check-ignore -q "$TARGET" 2>/dev/null; then
    ok "$TARGET is git-ignored"
  else
    bad "$TARGET is NOT git-ignored — add it to .gitignore before committing anything."
  fi
fi

# 3. Verify -------------------------------------------------------------------
say ""
say "Connection check"
[ -f "$TARGET" ] || { bad "no key at $TARGET. Run: $0 <downloaded-key.json>"; exit 1; }
GSC_CREDENTIALS_FILE="$TARGET" node scripts/gsc-check.mjs 2>&1 | sed 's/^/  /'
