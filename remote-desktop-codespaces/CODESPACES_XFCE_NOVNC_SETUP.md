# Codespaces XFCE + noVNC Setup

This repo is now set up with:

- `xfce4` (desktop environment)
- `tigervnc-standalone-server` (VNC server)
- `novnc` + `websockify` (browser access)

## 1) Install commands used in this Codespace

`apt update` originally failed because of a broken Yarn repo key in this environment, so Ubuntu sources were used directly for the install:

```bash
TMP_APT_DIR=$(mktemp -d)
sudo cp /etc/apt/sources.list.d/ubuntu.sources "$TMP_APT_DIR/"
sudo cp /etc/apt/sources.list.d/microsoft.list "$TMP_APT_DIR/"
sudo cp /etc/apt/sources.list.d/conda.list "$TMP_APT_DIR/" || true

sudo apt-get -o Dir::Etc::sourcelist=/dev/null -o Dir::Etc::sourceparts="$TMP_APT_DIR" update
sudo DEBIAN_FRONTEND=noninteractive apt-get \
  -o Dir::Etc::sourcelist=/dev/null \
  -o Dir::Etc::sourceparts="$TMP_APT_DIR" \
  install -y xfce4 xfce4-goodies tigervnc-standalone-server tigervnc-common novnc websockify dbus-x11
```

## 2) Files added for this setup

- `remote-desktop-codespaces/start-desktop.sh`
- `remote-desktop-codespaces/stop-desktop.sh`

`remote-desktop-codespaces/start-desktop.sh` also creates `~/.vnc/xstartup` automatically (if missing) with:

```bash
#!/usr/bin/env bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
exec startxfce4
```

## 3) Start desktop

From repo root:

```bash
./remote-desktop-codespaces/start-desktop.sh
```

Default ports:

- VNC internal: `5901` (display `:1`)
- noVNC web: `6080`
- default VNC geometry: `1336x768`

Default VNC password (only created on first run): `codespace`

To use a custom VNC password:

```bash
VNC_PASSWORD='your_password_here' ./remote-desktop-codespaces/start-desktop.sh
```

## 4) Forward and open in Codespaces

1. Open the **Ports** panel in Codespaces.
2. Forward port `6080`.
3. Open:

```text
https://<forwarded-url>/vnc.html
```

Important:

- Do **not** open port `5901` in a browser. `5901` is raw VNC and browser requests can fail with `502`.
- Use port `6080` with `/vnc.html`.
- If your codespace exposes the default forwarding domain, direct URL format is:

```text
https://<codespace-name>-6080.<forwarding-domain>/vnc.html
```

## 5) Stop desktop

```bash
./remote-desktop-codespaces/stop-desktop.sh
```

## 6) Optional environment overrides

You can override defaults when starting:

```bash
DISPLAY_NUM=1 \
VNC_GEOMETRY=1336x768 \
VNC_DEPTH=24 \
NOVNC_PORT=6080 \
./remote-desktop-codespaces/start-desktop.sh
```
