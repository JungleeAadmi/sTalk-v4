#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TARGET_DIR="/opt/stalk"

echo -e "${GREEN}🚀 sTalk v4.1 Auto-Installer${NC}"

# 1. Check Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash ...)${NC}"
  exit
fi

# 2. System Updates & Time Sync (CRITICAL FOR PUSH NOTIFICATIONS)
echo -e "${YELLOW}📦 Updating System & Syncing Time...${NC}"
apt update && apt upgrade -y
apt install -y systemd-timesyncd
timedatectl set-ntp true

# 3. Install Dependencies
echo -e "${YELLOW}🛠️ Checking Dependencies...${NC}"
if ! command -v curl &> /dev/null; then apt install -y curl; fi
if ! command -v git &> /dev/null; then apt install -y git; fi
if ! command -v build-essential &> /dev/null; then apt install -y build-essential; fi
if ! command -v nginx &> /dev/null; then apt install -y nginx; fi

# Node.js Check
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# PM2 Check
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# 4. Project Setup
echo -e "${YELLOW}📂 Setting up sTalk at $TARGET_DIR...${NC}"

if [ -d "$TARGET_DIR" ]; then
    echo "Directory exists. Pulling latest changes..."
    cd $TARGET_DIR
    git pull
else
    git clone https://github.com/JungleeAadmi/sTalk-v4.git $TARGET_DIR
    cd $TARGET_DIR
fi

# 5. Initialize Data
if [ ! -f "database.json" ]; then
    echo "Creating fresh database..."
    cp database.template.json database.json
fi
mkdir -p uploads

# 6. Install & Build
echo -e "${YELLOW}☕ Installing Backend Deps...${NC}"
npm install

echo -e "${YELLOW}🎨 Building Frontend...${NC}"
cd client
npm install
npm run build
cd ..

# 7. Startup
echo -e "${GREEN}🚀 Launching...${NC}"
pm2 stop stalk 2>/dev/null || true
pm2 delete stalk 2>/dev/null || true
pm2 start server.js --name "stalk"
pm2 save
pm2 startup

echo -e "${GREEN}✅ Installation Complete!${NC}"
echo -e "Access at: http://$(hostname -I | awk '{print $1}'):3000"