#!/usr/bin/env bash
# install-gsc-weekly.sh — schedule scripts/gsc-weekly.sh for Thursdays on this machine.
#
#   ./scripts/install-gsc-weekly.sh              # Thursdays 09:00 (local time)
#   ./scripts/install-gsc-weekly.sh 10:30        # another time
#   ./scripts/install-gsc-weekly.sh --uninstall
#   ./scripts/install-gsc-weekly.sh --status
#
# macOS : a launchd agent (~/Library/LaunchAgents/il.co.teleco.gsc-weekly.plist).
#         If the Mac is asleep at the scheduled time, launchd runs the job on wake.
#         If it is shut down, that week's run is skipped.
# Linux : a crontab line. If the machine is off, that week's run is skipped.
# Windows: not scripted — see docs/gsc-weekly.md for the schtasks command.
#
# The job only works while the computer is on. Nothing runs in the cloud and the
# service-account key never leaves this machine.

set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
RUNNER="$REPO/scripts/gsc-weekly.sh"
LABEL="il.co.teleco.gsc-weekly"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
CRON_TAG="# $LABEL"
MODE="install"; TIME="09:00"

case "${1:-}" in
  --uninstall) MODE="uninstall" ;;
  --status)    MODE="status" ;;
  "")          ;;
  [0-2][0-9]:[0-5][0-9]) TIME="$1" ;;
  *) echo "usage: $0 [HH:MM|--uninstall|--status]" >&2; exit 2 ;;
esac
HOUR="${TIME%%:*}"; MIN="${TIME##*:}"
HOUR=$((10#$HOUR)); MIN=$((10#$MIN))

os="$(uname -s)"
case "$os" in
  Darwin)
    case "$MODE" in
      status)
        if [ -f "$PLIST" ]; then echo "installed: $PLIST"; launchctl list 2>/dev/null | grep -F "$LABEL" || echo "(not loaded in this session — log in again or run: launchctl load $PLIST)"; else echo "not installed"; fi ;;
      uninstall)
        launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || launchctl unload "$PLIST" 2>/dev/null || true
        rm -f "$PLIST"; echo "removed $LABEL" ;;
      install)
        mkdir -p "$HOME/Library/LaunchAgents"
        cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$RUNNER</string></array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>StartCalendarInterval</key><dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>$HOUR</integer><key>Minute</key><integer>$MIN</integer></dict>
  <key>StandardOutPath</key><string>$REPO/reports/gsc/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$REPO/reports/gsc/launchd.err.log</string>
  <key>EnvironmentVariables</key><dict><key>HOME</key><string>$HOME</string><key>LANG</key><string>he_IL.UTF-8</string></dict>
</dict></plist>
PL
        mkdir -p "$REPO/reports/gsc"
        launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
        launchctl bootstrap "gui/$(id -u)" "$PLIST" 2>/dev/null || launchctl load "$PLIST"
        echo "installed $LABEL: every Thursday at $TIME (local). Plist: $PLIST"
        echo "test now:  launchctl kickstart -k gui/$(id -u)/$LABEL   (or ./scripts/gsc-weekly.sh)" ;;
    esac ;;
  Linux)
    command -v crontab >/dev/null 2>&1 || { echo "crontab not found; install cron or use a systemd timer." >&2; exit 1; }
    existing="$(crontab -l 2>/dev/null | grep -vF "$CRON_TAG" || true)"
    case "$MODE" in
      status) crontab -l 2>/dev/null | grep -F "$CRON_TAG" || echo "not installed" ;;
      uninstall) printf '%s\n' "$existing" | crontab -; echo "removed $LABEL" ;;
      install)
        line="$MIN $HOUR * * 4 cd '$REPO' && /bin/bash '$RUNNER' >/dev/null 2>&1 $CRON_TAG"
        { [ -n "$existing" ] && printf '%s\n' "$existing"; printf '%s\n' "$line"; } | crontab -
        echo "installed $LABEL: every Thursday at $TIME (local). Line: $line" ;;
    esac ;;
  *)
    echo "Unsupported OS ($os). On Windows, run in PowerShell:" >&2
    echo "  schtasks /Create /SC WEEKLY /D THU /ST $TIME /TN \"$LABEL\" /TR \"bash '$RUNNER'\"" >&2
    exit 1 ;;
esac
