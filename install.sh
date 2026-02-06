#!/bin/bash
set -e

# ============================================================
#  PasteVault - Interactive Installer for Ubuntu
#  Usage: sudo bash install.sh
# ============================================================

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
echo " ------------------------------------------------"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "  ERROR: Please run as root"
  echo "  sudo bash install.sh"
  echo ""
  exit 1
fi

# ---- Interactive Prompts ----

read -p "  Port to run on [3000]: " INPUT_PORT
PORT="${INPUT_PORT:-3000}"

read -p "  Admin password [admin]: " INPUT_PASS
ADMIN_PASSWORD="${INPUT_PASS:-admin}"

echo ""
echo "  SSL Configuration (optional)"
echo "  Leave blank to skip (HTTP only)"
read -p "  SSL cert path (fullchain.pem): " SSL_CERT
read -p "  SSL key path  (privkey.pem):   " SSL_KEY

echo ""
echo " ------------------------------------------------"
echo "  Port:     $PORT"
echo "  Install:  $INSTALL_DIR"
if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
  echo "  SSL:      Enabled"
  echo "  Cert:     $SSL_CERT"
  echo "  Key:      $SSL_KEY"
else
  echo "  SSL:      Disabled (HTTP)"
fi
echo " ------------------------------------------------"
echo ""
read -p "  Continue? (Y/n) " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
  echo "  Cancelled."
  exit 0
fi

echo ""

# ---- Install Node.js ----
if ! command -v node &> /dev/null; then
  echo "  [1/6] Installing Node.js $NODE_VERSION..."
  apt-get update -qq
  apt-get install -y -qq curl gnupg ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -qq nodejs
else
  echo "  [1/6] Node.js found: $(node -v)"
fi

# ---- Build tools ----
echo "  [2/6] Installing build dependencies..."
apt-get install -y -qq build-essential python3 2>/dev/null || true

# ---- pnpm ----
if ! command -v pnpm &> /dev/null; then
  echo "  [3/6] Installing pnpm..."
  npm install -g pnpm
else
  echo "  [3/6] pnpm found"
fi

# ---- Copy project ----
echo "  [4/6] Setting up project..."

if [ -d "$INSTALL_DIR/data" ]; then
  cp -r "$INSTALL_DIR/data" "/tmp/pastevault_backup" 2>/dev/null || true
fi

mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
cd "$INSTALL_DIR"

if [ -d "/tmp/pastevault_backup" ]; then
  cp -r "/tmp/pastevault_backup" "$INSTALL_DIR/data"
  rm -rf "/tmp/pastevault_backup"
fi

mkdir -p "$INSTALL_DIR/data/uploads"

# ---- Config file ----
SESSION_SECRET=$(openssl rand -hex 32)

cat > "$CONFIG_FILE" <<ENVEOF
# PasteVault Configuration
# Edit this file and restart: sudo systemctl restart pastevault

PORT=$PORT
NODE_ENV=production
HOSTNAME=0.0.0.0
SESSION_SECRET=$SESSION_SECRET
ADMIN_PASSWORD=$ADMIN_PASSWORD
DATA_DIR=$INSTALL_DIR/data

# SSL (leave empty to disable)
SSL_CERT=$SSL_CERT
SSL_KEY=$SSL_KEY
ENVEOF

# Also write .env for the build
cp "$CONFIG_FILE" "$INSTALL_DIR/.env"

# ---- Build ----
echo "  [5/6] Installing dependencies & building..."
cd "$INSTALL_DIR"
pnpm install --no-frozen-lockfile 2>&1 | tail -3
pnpm add better-sqlite3 2>&1 | tail -3
pnpm run build 2>&1 | tail -5

# ---- Standalone setup ----
mkdir -p "$INSTALL_DIR/.next/standalone/.next"
cp -r "$INSTALL_DIR/.next/static" "$INSTALL_DIR/.next/standalone/.next/static" 2>/dev/null || true
cp -r "$INSTALL_DIR/public" "$INSTALL_DIR/.next/standalone/public" 2>/dev/null || true

# Copy native modules
for mod in better-sqlite3 bindings file-uri-to-path prebuild-install; do
  cp -r "$INSTALL_DIR/node_modules/$mod" "$INSTALL_DIR/.next/standalone/node_modules/$mod" 2>/dev/null || true
done

# ---- Create custom HTTPS server if SSL ----
if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
  cat > "$INSTALL_DIR/server-ssl.js" <<'SSLEOF'
const https = require("https");
const fs = require("fs");
const { parse } = require("url");
const next = require("next");

const dev = false;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

const sslOptions = {
  cert: fs.readFileSync(process.env.SSL_CERT),
  key: fs.readFileSync(process.env.SSL_KEY),
};

app.prepare().then(() => {
  https.createServer(sslOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> PasteVault running at https://${hostname}:${port}`);
  });
});
SSLEOF
  cp "$INSTALL_DIR/server-ssl.js" "$INSTALL_DIR/.next/standalone/server-ssl.js"
  EXEC_CMD="$(which node) $INSTALL_DIR/.next/standalone/server-ssl.js"
else
  EXEC_CMD="$(which node) $INSTALL_DIR/.next/standalone/server.js"
fi

# ---- systemd service ----
echo "  [6/6] Creating systemd service..."
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
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

PROTOCOL="http"
if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
  PROTOCOL="https"
fi

echo ""
echo " ================================================"
echo "  PasteVault installed!"
echo " ================================================"
echo ""
echo "  URL:       $PROTOCOL://localhost:$PORT"
echo "  Admin:     $PROTOCOL://localhost:$PORT/auth/login"
echo "  Password:  $ADMIN_PASSWORD"
echo ""
echo "  Config:    $CONFIG_FILE"
echo "  Database:  $INSTALL_DIR/data/pastevault.db"
echo "  Uploads:   $INSTALL_DIR/data/uploads/"
echo ""
echo "  Commands:"
echo "    systemctl status  $SERVICE_NAME"
echo "    systemctl restart $SERVICE_NAME"
echo "    systemctl stop    $SERVICE_NAME"
echo "    journalctl -u $SERVICE_NAME -f"
echo ""
echo "  Change admin password:"
echo "    1. Edit $CONFIG_FILE"
echo "    2. sudo systemctl restart $SERVICE_NAME"
echo ""
echo "  Design and developed by Hmray"
echo "  https://t.me/hmrayserver"
echo ""
