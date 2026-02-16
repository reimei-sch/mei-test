#!/usr/bin/env bash
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-1}"
VNC_GEOMETRY="${VNC_GEOMETRY:-1336x768}"
VNC_DEPTH="${VNC_DEPTH:-24}"
NOVNC_PORT="${NOVNC_PORT:-6080}"
VNC_PORT="$((5900 + DISPLAY_NUM))"
NOVNC_WEB_ROOT="${NOVNC_WEB_ROOT:-/usr/share/novnc}"

if ! command -v vncserver >/dev/null 2>&1; then
  echo "vncserver not found. Install tigervnc-standalone-server first."
  exit 1
fi

if ! command -v websockify >/dev/null 2>&1; then
  echo "websockify not found. Install websockify first."
  exit 1
fi

if [[ ! -f "${NOVNC_WEB_ROOT}/vnc.html" ]]; then
  echo "noVNC web files not found in ${NOVNC_WEB_ROOT}."
  echo "Install novnc (or set NOVNC_WEB_ROOT to the correct path)."
  exit 1
fi

mkdir -p "$HOME/.vnc"

if [[ ! -f "$HOME/.vnc/xstartup" ]]; then
  cat >"$HOME/.vnc/xstartup" <<'EOF'
#!/usr/bin/env bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
exec startxfce4
EOF
  chmod +x "$HOME/.vnc/xstartup"
fi

if [[ ! -f "$HOME/.vnc/passwd" ]]; then
  VNC_PASSWORD="${VNC_PASSWORD:-codespace}"
  printf "%s\n" "$VNC_PASSWORD" | vncpasswd -f > "$HOME/.vnc/passwd"
  chmod 600 "$HOME/.vnc/passwd"
  echo "Created ~/.vnc/passwd (default password: ${VNC_PASSWORD})."
  echo "Set VNC_PASSWORD before running this script to use a different password."
fi

if [[ -f "$HOME/.vnc/novnc.pid" ]]; then
  OLD_PID="$(cat "$HOME/.vnc/novnc.pid" || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" || true
  fi
  rm -f "$HOME/.vnc/novnc.pid"
fi

vncserver -kill ":${DISPLAY_NUM}" >/dev/null 2>&1 || true
vncserver ":${DISPLAY_NUM}" -geometry "${VNC_GEOMETRY}" -depth "${VNC_DEPTH}" -localhost yes

nohup websockify --web "${NOVNC_WEB_ROOT}" "0.0.0.0:${NOVNC_PORT}" "127.0.0.1:${VNC_PORT}" \
  >"$HOME/.vnc/novnc.log" 2>&1 &
echo $! > "$HOME/.vnc/novnc.pid"

echo ""
echo "Desktop started:"
echo "  VNC display: :${DISPLAY_NUM}"
echo "  VNC endpoint: 127.0.0.1:${VNC_PORT}"
echo "  noVNC URL path: /vnc.html"
echo "  noVNC listen port: ${NOVNC_PORT}"
echo ""
echo "In Codespaces, forward port ${NOVNC_PORT}, then open:"
echo "  https://<forwarded-url>/vnc.html"
if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
  echo ""
  echo "Direct noVNC URL for this codespace:"
  echo "  https://${CODESPACE_NAME}-${NOVNC_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/vnc.html"
fi
echo ""
echo "Note: port ${VNC_PORT} is raw VNC and will fail in a browser."
echo "Use port ${NOVNC_PORT} with /vnc.html."
