#!/bin/bash
set -e

# ConfigVault - Install Script for Ubuntu
# This script installs ConfigVault on your local Ubuntu server

APP_DIR="/opt/configvault"
DATA_DIR="/opt/configvault/data"
PORT="${1:-3000}"

echo "============================================"
echo "  ConfigVault - Local Install"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash install.sh [port]"
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js 18+ is required. Found: $(node -v)"
  echo "Please update Node.js and try again."
  exit 1
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo ""

# Install build dependencies for better-sqlite3
echo "Installing build dependencies..."
apt-get update -qq
apt-get install -y -qq build-essential python3 > /dev/null 2>&1

# Create app directory
echo "Setting up $APP_DIR..."
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"

# Copy project files
echo "Copying project files..."
cp -r . "$APP_DIR/"

cd "$APP_DIR"

# Install dependencies
echo "Installing dependencies (this may take a minute)..."
npm install --production=false 2>&1 | tail -5

# Build the project
echo "Building ConfigVault..."
DATA_DIR="$DATA_DIR" npm run build 2>&1 | tail -5

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/configvault.service << EOF
[Unit]
Description=ConfigVault Admin Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=$(which node) $APP_DIR/.next/standalone/server.js
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=DATA_DIR=$DATA_DIR
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload and start
systemctl daemon-reload
systemctl enable configvault
systemctl restart configvault

echo ""
echo "============================================"
echo "  ConfigVault installed successfully!"
echo "============================================"
echo ""
echo "  URL:       http://localhost:$PORT"
echo "  Login:     admin / admin"
echo "  Data:      $DATA_DIR"
echo "  Database:  $DATA_DIR/configvault.db"
echo "  Uploads:   $DATA_DIR/uploads"
echo ""
echo "  Commands:"
echo "    sudo systemctl status configvault"
echo "    sudo systemctl restart configvault"
echo "    sudo systemctl stop configvault"
echo "    sudo journalctl -u configvault -f"
echo ""
echo "  IMPORTANT: Change the default password"
echo "  after your first login!"
echo ""
