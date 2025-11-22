#!/bin/bash
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
TARGET_DIR="/opt/stalk"

echo -e "${RED}⚠️  sTalk Uninstaller${NC}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "sTalk is not installed at $TARGET_DIR."
    exit 1
fi

read -p "Do you want to backup your data first? (y/n): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    BACKUP_NAME="stalk_final_backup_$(date +%F).zip"
    echo -e "${YELLOW}📦 Zipping data to /root/$BACKUP_NAME...${NC}"
    
    # Install zip if missing
    if ! command -v zip &> /dev/null; then apt install -y zip; fi

    cd $TARGET_DIR
    zip -r $BACKUP_NAME database.json uploads/ vapid.json
    mv $BACKUP_NAME /root/
fi

echo "Stopping services..."
pm2 stop stalk 2>/dev/null
pm2 delete stalk 2>/dev/null
pm2 save

echo "Removing files..."
rm -rf $TARGET_DIR

echo -e "${RED}❌ sTalk has been uninstalled.${NC}"