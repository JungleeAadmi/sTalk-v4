#!/bin/bash

APP_DIR="/opt/sTalk"
SERVICE_NAME="sTalk"
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}--- Updating sTalk ---${NC}"

if [ ! -d "$APP_DIR" ]; then
    echo "Error: sTalk directory not found. Is it installed?"
    exit 1
fi

cd "$APP_DIR"

# 1. Pull latest code
echo "Pulling changes from GitHub..."
git pull

# 2. Update dependencies
echo "Updating dependencies..."
npm install

# 3. Restart Process
echo "Restarting application..."
pm2 restart "$SERVICE_NAME"

echo -e "${GREEN}Update Complete!${NC}"