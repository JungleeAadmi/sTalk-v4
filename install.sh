#!/bin/bash

# Configuration
REPO_URL="https://github.com/JungleeAadmi/sTalk-v4.git"
APP_DIR="/opt/sTalk"
SERVICE_NAME="sTalk"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}--- sTalk Installer ---${NC}"

# 1. Update System
echo "Updating system..."
apt update && apt upgrade -y
apt install -y curl git gnupg

# 2. Install Node.js (if not present)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 3. Install PM2 (Process Manager)
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# 4. Clone or Update App
if [ -d "$APP_DIR" ]; then
    echo "App already exists. Updating instead..."
    cd "$APP_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 5. Install App Dependencies
echo "Installing dependencies..."
npm install

# 6. Start/Restart App
if pm2 list | grep -q "$SERVICE_NAME"; then
    pm2 restart "$SERVICE_NAME"
else
    pm2 start server.js --name "$SERVICE_NAME"
    pm2 save
    pm2 startup
fi

echo -e "${GREEN}Success! sTalk is running.${NC}"
echo -e "Access it at: http://$(hostname -I | awk '{print $1}'):3000"