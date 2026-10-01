#!/usr/bin/env bash
# gsc-mcp.sh — launcher for the Search Console MCP server (.mcp.json -> "gsc").
#
# Resolves the service-account key, then execs mcp-server-gsc on stdio.
#
# Key lookup order:
#   1. GSC_CREDENTIALS_FILE          — explicit path to a key file
#   2. .secrets/gsc-service-account.json — installed by scripts/setup-gsc-mcp.sh
#   3. GSC_SERVICE_ACCOUNT_JSON      — the key's JSON *content* in an env var.
#      Used by cloud sessions (claude.ai/code), where there is no local file:
#      store the key as an environment secret under that name and this script
#      writes it to .secrets/ (mode 600, git-ignored) on first launch.
#
# Pinned package version lives here, not in .mcp.json, so one place to bump.

set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="0.3.0"
DEFAULT_KEY=".secrets/gsc-service-account.json"
KEY="${GSC_CREDENTIALS_FILE:-$DEFAULT_KEY}"

if [ ! -s "$KEY" ] && [ -n "${GSC_SERVICE_ACCOUNT_JSON:-}" ]; then
  mkdir -p "$(dirname "$DEFAULT_KEY")"
  umask 077
  printf '%s' "$GSC_SERVICE_ACCOUNT_JSON" > "$DEFAULT_KEY"
  KEY="$DEFAULT_KEY"
  echo "gsc-mcp: wrote key from GSC_SERVICE_ACCOUNT_JSON to $KEY" >&2
fi

if [ ! -s "$KEY" ]; then
  echo "gsc-mcp: no service-account key found." >&2
  echo "  local machine : ./scripts/setup-gsc-mcp.sh <downloaded-key.json>" >&2
  echo "  cloud session : add environment secret GSC_SERVICE_ACCOUNT_JSON (the key file's JSON content)" >&2
  exit 1
fi

export GOOGLE_APPLICATION_CREDENTIALS="$KEY"
exec npx -y "mcp-server-gsc@$VERSION"
