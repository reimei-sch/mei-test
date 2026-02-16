#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-1}"

if [[ -f "$HOME/.vnc/novnc.pid" ]]; then
  NOVNC_PID="$(cat "$HOME/.vnc/novnc.pid" || true)"
  if [[ -n "${NOVNC_PID}" ]] && kill -0 "$NOVNC_PID" 2>/dev/null; then
    kill "$NOVNC_PID" || true
  fi
  rm -f "$HOME/.vnc/novnc.pid"
fi

if command -v vncserver >/dev/null 2>&1; then
  vncserver -kill ":${DISPLAY_NUM}" >/dev/null 2>&1 || true
fi

echo "Stopped noVNC and VNC display :${DISPLAY_NUM}."
