#!/bin/bash
# CAUTION: NO CONFIRMATION - REMOVES EVERYTHING
TARGET_DIR="/opt/stalk"

pm2 delete stalk 2>/dev/null
pm2 save
rm -rf $TARGET_DIR
rm -rf /opt/stalk_backups

echo "☢️  sTalk Nuked."
```

---

### 2. The Curl Commands

Once you have pushed those updated files to your GitHub repo (`main` branch), you can run these commands on **any** fresh LXC container or server.

#### 🚀 1. Install (One-Liner)
Installs dependencies, Node.js, clones the app, and starts it.
```bash
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/install.sh)
```

#### 🔄 2. Update (One-Liner)
Backs up your data, pulls the latest code from GitHub, and rebuilds the app.
```bash
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/update.sh)
```

#### ⚠️ 3. Uninstall (One-Liner)
Asks for a backup confirmation, then removes the app and PM2 service.
```bash
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/uninstall.sh)
```

#### ☢️ 4. Nuke (One-Liner)
Instantly deletes the app, backups, and process without asking.
```bash
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/nuke.sh)