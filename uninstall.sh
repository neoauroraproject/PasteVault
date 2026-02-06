#!/bin/bash
set -e

SERVICE_NAME="pastevault"
INSTALL_DIR="/opt/pastevault"

echo ""
echo "========================================"
echo "  PasteVault Uninstaller"
echo "========================================"
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Please run as root (sudo bash uninstall.sh)"
  exit 1
fi

read -p "This will remove PasteVault and ALL data. Continue? (y/N) " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "Stopping service..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || true
systemctl disable "$SERVICE_NAME" 2>/dev/null || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload

echo "Removing files..."
rm -rf "$INSTALL_DIR"

echo ""
echo "PasteVault has been removed."
echo ""
