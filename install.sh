#!/bin/bash
set -e

# ============================================================
# PasteVault - One-line installer for Ubuntu
# Usage: sudo bash install.sh [PORT] [ADMIN_PASSWORD]
# Example: sudo bash install.sh 3000 mysecretpass
# ============================================================

PORT="${1:-3000}"
ADMIN_PASSWORD="${2:-admin}"
INSTALL_DIR="/opt/pastevault"
SERVICE_NAME="pastevault"
NODE_VERSION="20"

echo ""
echo "========================================"
echo "  PasteVault Installer"
echo "========================================"
echo "  Port:     $PORT"
echo "  Install:  $INSTALL_DIR"
echo "========================================"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Please run as root (sudo bash install.sh)"
  exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
  echo "[1/6] Installing Node.js $NODE_VERSION..."
  apt-get update -qq
  apt-get install -y -qq curl gnupg ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -qq nodejs
else
  echo "[1/6] Node.js already installed: $(node -v)"
fi

# Install build tools for better-sqlite3
echo "[2/6] Installing build dependencies..."
apt-get install -y -qq build-essential python3 2>/dev/null || true

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
  echo "[3/6] Installing pnpm..."
  npm install -g pnpm
else
  echo "[3/6] pnpm already installed"
fi

# Copy project files
echo "[4/6] Setting up project in $INSTALL_DIR..."
if [ -d "$INSTALL_DIR/data" ]; then
  echo "  Backing up existing data..."
  cp -r "$INSTALL_DIR/data" "/tmp/pastevault_data_backup" 2>/dev/null || true
fi

mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# Restore data if backup exists
if [ -d "/tmp/pastevault_data_backup" ]; then
  cp -r "/tmp/pastevault_data_backup" "$INSTALL_DIR/data"
  rm -rf "/tmp/pastevault_data_backup"
fi

mkdir -p "$INSTALL_DIR/data/uploads"

# Create .env before build
cat > "$INSTALL_DIR/.env" <<EOF
PORT=$PORT
NODE_ENV=production
SESSION_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$ADMIN_PASSWORD
DATA_DIR=$INSTALL_DIR/data
HOSTNAME=0.0.0.0
EOF

# Install dependencies (including better-sqlite3)
echo "[5/6] Installing dependencies and building..."
cd "$INSTALL_DIR"
pnpm install --no-frozen-lockfile
pnpm run build

# Create systemd service
echo "[6/6] Creating systemd service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=PasteVault - Paste and File Sharing
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/.next/standalone
ExecStart=$(which node) $INSTALL_DIR/.next/standalone/server.js
Restart=always
RestartSec=5
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

# Copy static files for standalone mode
mkdir -p "$INSTALL_DIR/.next/standalone/.next"
cp -r "$INSTALL_DIR/.next/static" "$INSTALL_DIR/.next/standalone/.next/static" 2>/dev/null || true
cp -r "$INSTALL_DIR/public" "$INSTALL_DIR/.next/standalone/public" 2>/dev/null || true

# Copy better-sqlite3 native module into standalone
cp -r "$INSTALL_DIR/node_modules/better-sqlite3" "$INSTALL_DIR/.next/standalone/node_modules/better-sqlite3" 2>/dev/null || true
cp -r "$INSTALL_DIR/node_modules/bindings" "$INSTALL_DIR/.next/standalone/node_modules/bindings" 2>/dev/null || true
cp -r "$INSTALL_DIR/node_modules/prebuild-install" "$INSTALL_DIR/.next/standalone/node_modules/prebuild-install" 2>/dev/null || true
cp -r "$INSTALL_DIR/node_modules/file-uri-to-path" "$INSTALL_DIR/.next/standalone/node_modules/file-uri-to-path" 2>/dev/null || true

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "========================================"
echo "  PasteVault installed successfully!"
echo "========================================"
echo ""
echo "  URL:      http://localhost:$PORT"
echo "  Admin:    http://localhost:$PORT/auth/login"
echo "  Password: $ADMIN_PASSWORD"
echo "  Data:     $INSTALL_DIR/data/"
echo "  Database: $INSTALL_DIR/data/pastevault.db"
echo ""
echo "  Commands:"
echo "    sudo systemctl status $SERVICE_NAME"
echo "    sudo systemctl restart $SERVICE_NAME"
echo "    sudo systemctl stop $SERVICE_NAME"
echo "    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "  To uninstall:"
echo "    sudo systemctl stop $SERVICE_NAME"
echo "    sudo systemctl disable $SERVICE_NAME"
echo "    sudo rm /etc/systemd/system/${SERVICE_NAME}.service"
echo "    sudo rm -rf $INSTALL_DIR"
echo ""
echo "  IMPORTANT: Change the default admin password"
echo "  after first login!"
echo ""
