#!/bin/bash
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
TARGET_DIR="/opt/stalk"
BACKUP_ROOT="/opt/stalk_backups"

echo -e "${GREEN}🔄 sTalk Updater${NC}"

# Check Root (Required for apt installs)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo ./update.sh)${NC}"
  exit
fi

if [ ! -d "$TARGET_DIR" ]; then
    echo "sTalk is not installed at $TARGET_DIR."
    exit 1
fi

# 0. Sync Time (Crucial for SSL/Push)
echo -e "${YELLOW}🕒 Synchronizing System Time...${NC}"
apt install -y systemd-timesyncd
timedatectl set-ntp true

cd $TARGET_DIR

# 1. Backup
BACKUP_PATH="$BACKUP_ROOT/backup_$(date +%F_%H-%M)"
echo -e "${YELLOW}💾 Creating Backup at $BACKUP_PATH...${NC}"
mkdir -p $BACKUP_PATH
[ -f "database.json" ] && cp database.json $BACKUP_PATH/
[ -f "vapid.json" ] && cp vapid.json $BACKUP_PATH/
[ -d "uploads" ] && cp -r uploads $BACKUP_PATH/

# 2. Pull Code
echo -e "${YELLOW}⬇️ Pulling latest code...${NC}"
git pull

# 3. Rebuild
echo -e "${YELLOW}🔨 Rebuilding...${NC}"
npm install
cd client
npm install
npm run build
cd ..

# 4. Restart
echo -e "${GREEN}🚀 Restarting Server...${NC}"
pm2 restart stalk

echo -e "${GREEN}✅ Update Complete! Your data is safe.${NC}"