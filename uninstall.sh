#!/bin/bash

APP_DIR="/opt/sTalk"
SERVICE_NAME="sTalk"
BACKUP_DIR="/root/sTalk_Backups"
DATE=$(date +%F_%H-%M)

echo "--- Uninstalling sTalk ---"

# 1. Stop App
echo "Stopping service..."
pm2 stop "$SERVICE_NAME"
pm2 delete "$SERVICE_NAME"
pm2 save

# 2. Backup Data
echo "Creating backup..."
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/sTalk_backup_$DATE.tar.gz" "$APP_DIR"
echo "Backup saved to $BACKUP_DIR/sTalk_backup_$DATE.tar.gz"

# 3. Remove Files
echo "Removing application files..."
rm -rf "$APP_DIR"

echo "Uninstall complete. Node.js and PM2 remain on the system."