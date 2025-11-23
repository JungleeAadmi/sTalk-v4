# STILL IN TESTING PHASE

# sTalk v4 - Self-Hosted Private Chat

A Progressive Web App (PWA) 100% made by AI, no human coding involved and its purely for self-hosting and privacy.

![sTalk Banner](client/public/logo.png)

## ✨ Features
🔔 Multi-Device Push: Notifications ring on all your devices (iOS, Android, Desktop) simultaneously.
 - ***please note that your server/lxc container time has to same as your local time to make this push notification work***

🎙️ Voice Notes: Record and send audio messages directly.

❤️ Reactions: Double-tap messages to react with emojis.

↩️ Reply & Edit: Swipe context for replies and fix typos with message editing.

🎨 Pro Themes: New "Stealth Grey" Dark Mode + 12 accent color options (Pink, Teal, Purple, etc.).

📸 4K Media: Send full-resolution photos and videos (up to 1GB).

✂️ Smart Crop: Built-in zoom & crop tool for profile pictures.

## 🚀 Core Features

🔒 Self-Hosted: Your data, your disk. No tracking.

📱 True PWA: Installable on iOS & Android (looks and feels like a native app).

⚡ Real-Time: Instant messaging via Socket.io.

🛡️ Admin Console: Manage users and reset passwords securely.

***Default Credentials***

    User: admin

    Pass: adminpassword

## ⚠️ MANDATORY: Change the admin password immediately after logging in via Settings -> Profile.

## 🚀 One-Line Installation
Run this on your Ubuntu/Debian/Proxmox LXC container:

## note:
 
Please check if you have curl and sudo installed.  

```
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/install.sh)
```
## 🔄 Update
## Updates the app while backing up your chats and files automatically:
```
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/update.sh)
```
## 🗑️ Uninstall
```
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/uninstall.sh)
```
## ☢️ Nuke (Delete All) - WARNING - DO AT YOUR OWN RISK

```
bash <(curl -sL https://raw.githubusercontent.com/JungleeAadmi/sTalk-v4/main/nuke.sh)

```

## 📱 iOS & Android Setup Guide

Open your domain (https://chat.yourdomain.com) in Safari.

Tap the Share icon -> Add to Home Screen.

Launch the app from the Home Screen icon.

Go to Settings -> Enable Push Notifications, follow the popups. 

## 📜 License

Open Source. Use at your own risk.