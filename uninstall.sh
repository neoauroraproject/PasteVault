#!/bin/bash
set -e

# ============================================================
#  PasteVault - Uninstaller
#  bash <(curl -Ls https://raw.githubusercontent.com/neoauroraproject/PasteVault/main/uninstall.sh)
# ============================================================

SERVICE_NAME="pastevault"
INSTALL_DIR="/opt/pastevault"

if [ "$EUID" -ne 0 ]; then
  echo "  Please run as root (sudo)"
  exit 1
fi

echo ""
echo "  PasteVault Uninstaller"
echo " ------------------------------------------------"
echo ""

read -p "  Delete all data (pastes, files, database)? [y/N] " DEL_DATA

echo ""
echo "  Stopping service..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || true
systemctl disable "$SERVICE_NAME" 2>/dev/null || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload

if [[ "$DEL_DATA" =~ ^[Yy]$ ]]; then
  echo "  Removing $INSTALL_DIR (with all data)..."
  rm -rf "$INSTALL_DIR"
else
  echo "  Removing $INSTALL_DIR (keeping data/ and config.env)..."
  find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' ! -name 'config.env' -exec rm -rf {} +
fi

echo ""
echo "  PasteVault has been uninstalled."
echo ""
