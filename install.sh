#!/bin/bash
set -e

# ============================================================
#  PasteVault - One-Line Installer for Ubuntu
#  bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/install.sh)
# ============================================================

REPO="https://github.com/neoauroraproject/PasteVault.git"
BRANCH="main"
INSTALL_DIR="/opt/pastevault"
SERVICE_NAME="pastevault"
NODE_VERSION="20"
CONFIG_FILE="$INSTALL_DIR/config.env"

clear
echo ""
echo "  ____           _    __     __          _ _   "
echo " |  _ \\ __ _ ___| |_ __\\ \\   / /_ _ _   _| | |_ "
echo " | |_) / _\` / __| __/ _ \\ \\ / / _\` | | | | | __|"
echo " |  __/ (_| \\__ \\ ||  __/\\ V / (_| | |_| | | |_ "
echo " |_|   \\__,_|___/\\__\\___| \\_/ \\__,_|\\__,_|_|\\__|"
echo ""
echo " ------------------------------------------------"
echo "  Paste & File Sharing - Self Hosted"
echo "  https://github.com/neoauroraproject/PasteVault"
echo " ------------------------------------------------"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "  ERROR: Please run as root (use sudo)"
  echo ""
  echo "  bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/install.sh)"
  echo ""
  exit 1
fi

# ---- Detect update or fresh install ----
IS_UPDATE=false
if [ -d "$INSTALL_DIR" ] && [ -f "$CONFIG_FILE" ]; then
  IS_UPDATE=true
  echo "  Existing installation detected!"
  echo "  Data and config will be preserved."
  echo ""
fi

# ---- Interactive Prompts ----
if [ "$IS_UPDATE" = true ]; then
  source "$CONFIG_FILE"
  echo "  Current config:"
  echo "    Port: ${PORT:-3000}"
  echo ""
  read -p "  Change port? (current: ${PORT:-3000}) [enter to keep]: " INPUT_PORT
  PORT="${INPUT_PORT:-$PORT}"
  PORT="${PORT:-3000}"
  read -p "  Change admin password? [enter to keep current]: " INPUT_PASS
  if [ -n "$INPUT_PASS" ]; then
    ADMIN_PASSWORD="$INPUT_PASS"
  fi
else
  read -p "  Port [3000]: " INPUT_PORT
  PORT="${INPUT_PORT:-3000}"

  read -p "  Admin password [admin]: " INPUT_PASS
  ADMIN_PASSWORD="${INPUT_PASS:-admin}"
fi

echo ""
echo "  -- SSL Configuration (optional) --"
echo "  Leave empty to skip (HTTP only)"
echo ""

if [ "$IS_UPDATE" = true ] && [ -n "$SSL_CERT" ]; then
  echo "  Current cert: $SSL_CERT"
  echo "  Current key:  $SSL_KEY"
  read -p "  Change SSL cert? [enter to keep]: " NEW_CERT
  if [ -n "$NEW_CERT" ]; then
    SSL_CERT="$NEW_CERT"
    read -p "  SSL key path: " SSL_KEY
  fi
else
  read -p "  SSL cert path (fullchain.pem): " SSL_CERT
  if [ -n "$SSL_CERT" ]; then
    read -p "  SSL key path  (privkey.pem):   " SSL_KEY
  fi
fi

echo ""
echo " ------------------------------------------------"
echo "  Port:     $PORT"
echo "  Install:  $INSTALL_DIR"
if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
  echo "  SSL:      Enabled"
else
  echo "  SSL:      Disabled (HTTP only)"
fi
if [ "$IS_UPDATE" = true ]; then
  echo "  Mode:     Update (data preserved)"
else
  echo "  Mode:     Fresh install"
fi
echo " ------------------------------------------------"
echo ""
read -p "  Continue? [Y/n] " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
  echo "  Cancelled."
  exit 0
fi

echo ""

# ---- Install system dependencies ----
echo "  [1/7] Installing system dependencies..."
apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq curl git build-essential python3 ca-certificates gnupg > /dev/null 2>&1

# ---- Install Node.js ----
if ! command -v node &> /dev/null; then
  echo "  [2/7] Installing Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
else
  echo "  [2/7] Node.js found: $(node -v)"
fi

# ---- pnpm ----
if ! command -v pnpm &> /dev/null; then
  echo "  [3/7] Installing pnpm..."
  npm install -g pnpm > /dev/null 2>&1
else
  echo "  [3/7] pnpm found: $(pnpm -v)"
fi

# ---- Backup existing data ----
if [ "$IS_UPDATE" = true ]; then
  echo "  [4/7] Backing up data..."
  cp -r "$INSTALL_DIR/data" "/tmp/pastevault_data_backup" 2>/dev/null || true
  cp "$CONFIG_FILE" "/tmp/pastevault_config_backup" 2>/dev/null || true
else
  echo "  [4/7] Fresh install, no backup needed"
fi

# ---- Clone from GitHub ----
echo "  [5/7] Downloading PasteVault..."
rm -rf /tmp/pastevault_src
if ! git clone --depth 1 -b "$BRANCH" "$REPO" /tmp/pastevault_src 2>/dev/null; then
  echo "         Branch '$BRANCH' not found, trying default branch..."
  git clone --depth 1 "$REPO" /tmp/pastevault_src 2>/dev/null
fi

mkdir -p "$INSTALL_DIR"
rsync -a --exclude='data' --exclude='config.env' --exclude='.env' --exclude='node_modules' /tmp/pastevault_src/ "$INSTALL_DIR/" 2>/dev/null || \
  cp -r /tmp/pastevault_src/. "$INSTALL_DIR/" 2>/dev/null || true
rm -rf /tmp/pastevault_src

# Restore backup
if [ "$IS_UPDATE" = true ] && [ -d "/tmp/pastevault_data_backup" ]; then
  cp -r "/tmp/pastevault_data_backup" "$INSTALL_DIR/data"
  rm -rf "/tmp/pastevault_data_backup"
  if [ -f "/tmp/pastevault_config_backup" ]; then
    rm -f "/tmp/pastevault_config_backup"
  fi
fi

mkdir -p "$INSTALL_DIR/data/uploads"

# ---- Config file ----
if [ ! -f "$CONFIG_FILE" ]; then
  SESSION_SECRET=$(openssl rand -hex 32)
else
  source "$CONFIG_FILE"
  SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}"
fi

cat > "$CONFIG_FILE" <<ENVEOF
# PasteVault Configuration
# Edit and restart: sudo systemctl restart pastevault

PORT=$PORT
NODE_ENV=production
HOSTNAME=0.0.0.0
SESSION_SECRET=$SESSION_SECRET
ADMIN_PASSWORD=$ADMIN_PASSWORD
DATA_DIR=$INSTALL_DIR/data

# SSL (leave empty for HTTP)
SSL_CERT=$SSL_CERT
SSL_KEY=$SSL_KEY
ENVEOF

cp "$CONFIG_FILE" "$INSTALL_DIR/.env"

# ---- Build ----
echo "  [6/7] Building (this may take a few minutes)..."
cd "$INSTALL_DIR"
rm -rf node_modules .next
pnpm install --no-frozen-lockfile 2>&1 | tail -2
pnpm add better-sqlite3 2>&1 | tail -2
NODE_ENV=production pnpm run build 2>&1 | tail -3

# Standalone setup
mkdir -p "$INSTALL_DIR/.next/standalone/.next"
cp -r "$INSTALL_DIR/.next/static" "$INSTALL_DIR/.next/standalone/.next/static" 2>/dev/null || true
cp -r "$INSTALL_DIR/public" "$INSTALL_DIR/.next/standalone/public" 2>/dev/null || true

# Copy native modules to standalone
for mod in better-sqlite3 bindings file-uri-to-path prebuild-install; do
  if [ -d "$INSTALL_DIR/node_modules/$mod" ]; then
    mkdir -p "$INSTALL_DIR/.next/standalone/node_modules"
    cp -r "$INSTALL_DIR/node_modules/$mod" "$INSTALL_DIR/.next/standalone/node_modules/$mod"
  fi
done

# ---- SSL server ----
if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
  cat > "$INSTALL_DIR/.next/standalone/server-ssl.js" <<'SSLEOF'
const https = require("https");
const fs = require("fs");
const { parse } = require("url");
const next = require("next");
const app = next({ dev: false, hostname: process.env.HOSTNAME || "0.0.0.0", port: parseInt(process.env.PORT || "3000") });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  https.createServer({
    cert: fs.readFileSync(process.env.SSL_CERT),
    key: fs.readFileSync(process.env.SSL_KEY),
  }, (req, res) => handle(req, res, parse(req.url, true)))
  .listen(parseInt(process.env.PORT || "3000"), process.env.HOSTNAME || "0.0.0.0", () => {
    console.log("> PasteVault running on https://" + (process.env.HOSTNAME || "0.0.0.0") + ":" + (process.env.PORT || "3000"));
  });
});
SSLEOF
  EXEC_CMD="$(which node) $INSTALL_DIR/.next/standalone/server-ssl.js"
else
  EXEC_CMD="$(which node) $INSTALL_DIR/.next/standalone/server.js"
fi

# ---- systemd ----
echo "  [7/7] Creating service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<SVCEOF
[Unit]
Description=PasteVault
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/.next/standalone
ExecStart=$EXEC_CMD
Restart=always
RestartSec=5
EnvironmentFile=$CONFIG_FILE

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" > /dev/null 2>&1
systemctl restart "$SERVICE_NAME"

PROTOCOL="http"
[ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ] && PROTOCOL="https"
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo " ================================================"
echo "  PasteVault installed successfully!"
echo " ================================================"
echo ""
echo "  URL:       $PROTOCOL://$SERVER_IP:$PORT"
echo "  Admin:     $PROTOCOL://$SERVER_IP:$PORT/auth/login"
echo "  Password:  $ADMIN_PASSWORD"
echo ""
echo "  Config:    $CONFIG_FILE"
echo "  Data:      $INSTALL_DIR/data/"
echo ""
echo "  Commands:"
echo "    systemctl status  $SERVICE_NAME"
echo "    systemctl restart $SERVICE_NAME"
echo "    systemctl stop    $SERVICE_NAME"
echo "    journalctl -u $SERVICE_NAME -f"
echo ""
echo "  Update:"
echo "    bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/install.sh)"
echo ""
echo "  Uninstall:"
echo "    bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/uninstall.sh)"
echo ""
echo "  Design and developed by Hmray"
echo "  https://t.me/hmrayserver"
echo ""
