<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>sTalk - Secure Chat</title>
    
    <!-- PWA & Mobile Icons -->
    <link rel="manifest" href="manifest.json">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#8B5CF6">
    
    <!-- Icons -->
    <link rel="icon" type="image/svg+xml" href="logo.svg">
    <link rel="apple-touch-icon" href="logo.svg">
    
    <!-- Fonts: Nunito for Rounded Aesthetic -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* --- DYNAMIC THEME VARIABLES --- */
        :root {
            /* Defaults (Neon Purple + Charcoal) */
            --theme-primary: #8B5CF6;
            --theme-secondary: #3B82F6; /* Used for gradient */
            --theme-dark-bg: #1E1E1E;   /* Charcoal */
            
            /* Derived Gradient */
            --primary-grad: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
        }

        body {
            /* Updated Font Family */
            font-family: 'Nunito', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
            overscroll-behavior-y: none;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Chat Bubbles */
        .msg-bubble-self {
            background: var(--primary-grad);
            color: white;
            border-radius: 20px 20px 4px 20px; /* Slightly more rounded for Nunito */
        }
        .msg-bubble-other {
            background-color: #e5e7eb;
            color: #1f2937;
            border-radius: 20px 20px 20px 4px;
        }
        .dark .msg-bubble-other {
            background-color: #374151;
            color: #f3f4f6;
        }
        
        .tick { transition: all 0.2s ease; }
        .tick-read { color: #60A5FA; } 

        /* Toggle Switch */
        .toggle-checkbox:checked {
            right: 0;
            border-color: var(--theme-primary);
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: var(--theme-primary);
        }

        /* Zoom/Pan Container */
        .media-viewer-container img, .media-viewer-container video {
            transition: transform 0.1s ease-out;
            touch-action: none;
        }

        /* Theme Swatch Selected State (FIXED CSS) */
        .theme-swatch.selected {
            outline: 3px solid var(--theme-primary);
            outline-offset: 2px;
        }
    </style>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Nunito', 'sans-serif'],
                    },
                    colors: {
                        // Map Tailwind colors to our CSS variables for dynamic switching
                        primary: 'var(--theme-primary)', 
                        themeDarkBg: 'var(--theme-dark-bg)',
                        dark: '#111827' // Standard fallback
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-100 dark:bg-themeDarkBg h-screen overflow-hidden flex flex-col transition-colors duration-300 select-none font-sans">

    <!-- ===================== AUDIO SYSTEM ===================== -->
    <script>
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let soundEnabled = true;
        
        function playNotificationSound() {
            if (!soundEnabled) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const t = audioCtx.currentTime;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, t); 
            oscillator.frequency.exponentialRampToValueAtTime(800, t + 0.1);
            
            gainNode.gain.setValueAtTime(0, t);
            gainNode.gain.linearRampToValueAtTime(0.3, t + 0.05); 
            gainNode.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            
            oscillator.start(t);
            oscillator.stop(t + 1.5);
        }
    </script>

    <!-- ===================== MOCK BACKEND ===================== -->
    <script>
        class MockServer {
            constructor() {
                this.currentUser = null;
                const savedUsers = localStorage.getItem('sTalk_users');
                const savedChats = localStorage.getItem('sTalk_chats');
                
                if (savedUsers) {
                    this.users = JSON.parse(savedUsers);
                } else {
                    this.users = [
                        { id: 1, username: "admin", password: "admin", name: "Admin User", avatar: "", lastSeen: "Online", status: "online", role: 'admin', mustChangePassword: false },
                        { id: 2, username: "alice", password: "password", name: "Alice Johnson", avatar: "", lastSeen: "10:30 AM", status: "offline", role: 'user', mustChangePassword: false },
                        { id: 3, username: "bob", password: "password", name: "Bob Smith", avatar: "", lastSeen: "Yesterday", status: "offline", role: 'user', mustChangePassword: true }
                    ];
                    this.saveUsers();
                }
                if (savedChats) {
                    this.chats = JSON.parse(savedChats);
                } else {
                    this.chats = { 2: [{ id: 'm1', senderId: 2, text: "Hey there! Welcome to sTalk.", time: "10:00 AM", status: 'read', type: 'text' }] };
                    this.saveChats();
                }
            }

            saveUsers() { localStorage.setItem('sTalk_users', JSON.stringify(this.users)); }
            saveChats() { localStorage.setItem('sTalk_chats', JSON.stringify(this.chats)); }

            login(username, password) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
                        if (user) { this.currentUser = user; resolve(user); } 
                        else { reject("Invalid credentials"); }
                    }, 500);
                });
            }
            
            changePassword(newPassword) {
                this.currentUser.password = newPassword;
                this.currentUser.mustChangePassword = false;
                const idx = this.users.findIndex(u => u.id === this.currentUser.id);
                if(idx !== -1) this.users[idx] = this.currentUser;
                this.saveUsers();
                return Promise.resolve();
            }

            createAccount(name, username, password) {
                const newUser = {
                    id: Date.now(),
                    username: username,
                    password: password, 
                    name: name,
                    avatar: "",
                    lastSeen: "Never",
                    status: "offline",
                    role: "user",
                    mustChangePassword: true
                };
                this.users.push(newUser);
                this.saveUsers();
                return newUser;
            }

            sendMessage(chatId, text, type='text', fileData=null, replyTo=null) {
                return new Promise(resolve => {
                    const msg = {
                        id: 'm' + Date.now(),
                        senderId: this.currentUser.id,
                        text, type, fileData, replyTo,
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        status: 'sent'
                    };
                    if (!this.chats[chatId]) this.chats[chatId] = [];
                    this.chats[chatId].push(msg);
                    this.saveChats();
                    setTimeout(() => { msg.status = 'delivered'; updateUI(); }, 1500);
                    setTimeout(() => { msg.status = 'read'; updateUI(); }, 3500);
                    setTimeout(() => { if(Math.random() > 0.5) this.receiveMockReply(chatId); }, 4000);
                    resolve(msg);
                });
            }
            
            receiveMockReply(chatId) {
                const msg = {
                    id: 'm' + Date.now(),
                    senderId: parseInt(chatId),
                    text: "This is a reply to test the Ting Ting sound!",
                    type: 'text',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    status: 'read'
                };
                this.chats[chatId].push(msg);
                this.saveChats();
                updateUI();
                playNotificationSound();
            }
            
            deleteChat(chatId) { delete this.chats[chatId]; this.saveChats(); updateUI(); }
            adminDeleteUser(userId) { this.users = this.users.filter(u => u.id !== userId); this.saveUsers(); updateUI(); }
        }

        const server = new MockServer();
        let activeChatId = null;
        let replyContext = null; 
    </script>

    <!-- ===================== VIEWS ===================== -->

    <!-- 1. LOGIN SCREEN -->
    <div id="view-login" class="fixed inset-0 z-50 bg-gray-50 dark:bg-themeDarkBg flex items-center justify-center p-4 transition-colors duration-300">
        <!-- Login Dark Mode Toggle -->
        <button onclick="toggleTheme()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
             <i class="fas fa-adjust"></i>
        </button>

        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
            <!-- Inline SVG Logo -->
            <div class="w-24 h-24 mx-auto mb-6 rounded-[20px] shadow-lg overflow-hidden bg-gray-900">
                <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" fill="#1F2937"/>
                    <defs>
                        <linearGradient id="grad1-i" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#8B5CF6" />
                            <stop offset="100%" stop-color="#3B82F6" />
                        </linearGradient>
                    </defs>
                    <path d="M256 112C167.6 112 96 176.5 96 256C96 301.5 119.5 342.1 156.6 368.1C152.9 383.9 142.5 406.5 122.6 423.2C119.5 425.8 119.7 430.7 123.1 433C154.9 454.8 196.6 444.8 214.8 438.6C228.1 442.8 241.9 445.1 256.2 445.1C344.6 445.1 416 380.6 416 301.1C416 221.6 344.4 157.1 256 157.1V112Z" fill="url(#grad1-i)"/>
                    <circle cx="190" cy="256" r="25" fill="white" fill-opacity="0.9"/>
                    <circle cx="256" cy="256" r="25" fill="white" fill-opacity="0.9"/>
                    <circle cx="322" cy="256" r="25" fill="white" fill-opacity="0.9"/>
                </svg>
            </div>
            
            <h1 class="text-2xl font-extrabold text-gray-800 dark:text-white mb-2 tracking-tight">sTalk Login</h1>
            
            <input type="text" id="login-user" placeholder="Username" 
                class="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-primary mb-3 outline-none font-semibold">
            <input type="password" id="login-pass" placeholder="Password" 
                class="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-primary mb-4 outline-none font-semibold">
            
            <button onclick="appLogin()" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg active:scale-95 transition-transform">
                Login
            </button>
        </div>
    </div>

    <!-- 2. MAIN APP LAYOUT -->
    <div id="view-main" class="hidden flex-1 flex overflow-hidden relative">
        
        <!-- SIDEBAR -->
        <div id="sidebar" class="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col z-10">
            <!-- Header -->
            <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center gap-3 cursor-pointer" onclick="openSettingsModal()">
                    <!-- Avatar or Initials -->
                    <div id="my-avatar" class="w-10 h-10 rounded-full bg-opacity-20 bg-primary flex items-center justify-center text-primary font-bold overflow-hidden border border-gray-200 dark:border-gray-700">
                        <!-- JS Injected -->
                    </div>
                    <h2 id="my-username" class="font-bold text-gray-800 dark:text-white text-lg">User</h2>
                </div>
                <div class="flex gap-3">
                    <button id="admin-btn" onclick="toggleAdminPanel()" class="hidden w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <!-- Settings Button -->
                    <button onclick="openSettingsModal()" class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors hover:bg-gray-300 dark:hover:bg-gray-600">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>

            <!-- Search -->
            <div class="p-3">
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center px-3 py-2">
                    <i class="fas fa-search text-gray-400 mr-2"></i>
                    <input type="text" placeholder="Search" class="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200 font-medium">
                </div>
            </div>

            <!-- User List -->
            <div id="user-list" class="flex-1 overflow-y-auto">
                <!-- Injected via JS -->
            </div>
        </div>

        <!-- CHAT WINDOW -->
        <div id="chat-interface" class="flex-1 bg-[#efe7dd] dark:bg-themeDarkBg flex flex-col absolute inset-0 md:static transform translate-x-full md:translate-x-0 transition-transform duration-300 z-20">
            
            <!-- Chat Header -->
            <div class="bg-white dark:bg-gray-800 p-3 border-b dark:border-gray-700 flex items-center justify-between shadow-sm z-10">
                <div class="flex items-center gap-3">
                    <button onclick="closeChat()" class="md:hidden text-gray-600 dark:text-gray-300 p-2">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <div id="chat-header-avatar-container" class="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-sm font-bold">
                        <img id="chat-header-avatar" src="" class="w-full h-full object-cover hidden">
                        <span id="chat-header-initials" class="hidden"></span>
                    </div>
                    <div>
                        <h3 id="chat-header-name" class="font-bold text-gray-800 dark:text-white leading-tight">Name</h3>
                        <p id="chat-header-status" class="text-xs text-green-500 font-semibold">Online</p>
                    </div>
                </div>
                <div class="relative">
                    <button onclick="document.getElementById('chat-menu').classList.toggle('hidden')" class="p-2 text-gray-600 dark:text-gray-300">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div id="chat-menu" class="hidden absolute right-0 top-10 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 border dark:border-gray-600">
                        <button onclick="deleteCurrentChat()" class="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium">
                            <i class="fas fa-trash mr-2"></i> Delete Chat
                        </button>
                    </div>
                </div>
            </div>

            <!-- Messages Area -->
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-3 pb-20 bg-repeat bg-cover bg-center">
                <!-- Messages Injected JS -->
            </div>

            <!-- Reply Preview -->
            <div id="reply-preview" class="hidden bg-gray-100 dark:bg-gray-800 p-2 border-l-4 border-primary flex justify-between items-center mx-2 rounded-t-lg">
                <div class="pl-2 overflow-hidden">
                    <p class="text-xs text-primary font-bold">Replying to...</p>
                    <p id="reply-text" class="text-sm text-gray-600 dark:text-gray-300 truncate">Message</p>
                </div>
                <button onclick="cancelReply()" class="p-2 text-gray-500"><i class="fas fa-times"></i></button>
            </div>

            <!-- Input Area -->
            <div class="bg-white dark:bg-gray-800 p-3 flex items-end gap-2 border-t dark:border-gray-700">
                <button onclick="triggerFileUpload()" class="p-3 text-gray-500 hover:text-primary transition-colors">
                    <i class="fas fa-paperclip text-xl"></i>
                </button>
                <input type="file" id="file-input" class="hidden" multiple onchange="handleFiles(this.files)">
                
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 min-h-[45px] flex items-center">
                    <input type="text" id="msg-input" placeholder="Message" class="w-full bg-transparent outline-none text-gray-800 dark:text-white font-medium" onkeypress="if(event.key === 'Enter') sendMsg()">
                </div>
                
                <button onclick="sendMsg()" class="p-3 bg-primary text-white rounded-full shadow-lg hover:opacity-90 active:scale-90 transition-transform">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- ===================== MODALS ===================== -->

    <!-- SETTINGS MODAL -->
    <div id="settings-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h3 class="text-lg font-bold dark:text-white">Settings</h3>
                <button onclick="closeSettingsModal()" class="text-gray-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i class="fas fa-times"></i></button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto">
                
                <!-- Profile Section -->
                <div class="flex flex-col items-center mb-8">
                    <div class="relative group cursor-pointer" onclick="document.getElementById('avatar-upload').click()">
                        <div id="settings-avatar" class="w-24 h-24 rounded-full bg-opacity-20 bg-primary flex items-center justify-center text-primary text-2xl font-bold overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg"></div>
                        <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i class="fas fa-camera text-white text-xl"></i>
                        </div>
                    </div>
                    <h3 id="settings-name" class="mt-3 font-bold text-xl dark:text-white">User</h3>
                    <button onclick="document.getElementById('avatar-upload').click()" class="text-primary text-sm font-bold mt-1">Change Profile Photo</button>
                </div>

                <!-- Theme Section -->
                <div class="mb-6">
                    <h4 class="font-bold dark:text-white mb-3">Color Theme</h4>
                    <div class="grid grid-cols-4 gap-3" id="theme-selector">
                        <!-- Injected via JS -->
                    </div>
                </div>

                <!-- Custom Wallpaper Section (New) -->
                <div class="mb-6">
                    <h4 class="font-bold dark:text-white mb-3">Chat Wallpaper</h4>
                    <div class="flex gap-3">
                        <button onclick="document.getElementById('bg-upload').click()" class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-bold dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition">Upload Custom</button>
                        <button onclick="removeWallpaper()" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition"><i class="fas fa-trash"></i></button>
                    </div>
                    <input type="file" id="bg-upload" class="hidden" accept="image/*" onchange="saveWallpaper(this)">
                    <p class="text-xs text-gray-500 mt-2">Upload an image from your gallery to use as background.</p>
                </div>

                <!-- Toggles -->
                <div class="space-y-6">
                    <!-- Dark Mode -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><i class="fas fa-moon"></i></div>
                            <span class="font-bold dark:text-white">Dark Mode</span>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="theme-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" onclick="toggleTheme()"/>
                            <label for="theme-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>

                    <!-- Sounds -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><i class="fas fa-volume-up"></i></div>
                            <span class="font-bold dark:text-white">Sound Effects</span>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="sound-toggle" checked class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" onclick="toggleSound()"/>
                            <label for="sound-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                    
                    <!-- Push Notifications -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><i class="fas fa-bell"></i></div>
                            <span class="font-bold dark:text-white">Notifications</span>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="notif-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" onclick="toggleNotifications()"/>
                            <label for="notif-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                </div>

                <div class="border-t dark:border-gray-700 my-6"></div>

                <!-- Actions -->
                <div class="space-y-3">
                    <button onclick="openChangePwModal()" class="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-left font-bold dark:text-white flex justify-between items-center">
                        Change Password
                        <i class="fas fa-chevron-right text-gray-400 text-sm"></i>
                    </button>
                    <button onclick="logout()" class="w-full p-3 rounded-xl bg-red-50 text-red-600 text-left font-bold flex justify-between items-center">
                        Log Out
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- CHANGE PASSWORD MODAL -->
    <div id="change-pw-modal" class="hidden fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 class="font-bold text-lg mb-4 dark:text-white">Change Password</h3>
            <input type="password" id="cp-new" placeholder="New Password" class="w-full p-3 mb-3 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white outline-none font-semibold">
            <div class="flex gap-3">
                <button onclick="document.getElementById('change-pw-modal').classList.add('hidden')" class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg dark:text-white font-semibold">Cancel</button>
                <button onclick="saveNewPassword()" class="flex-1 py-2 bg-primary text-white rounded-lg font-bold">Save</button>
            </div>
        </div>
    </div>

    <!-- CROPPER MODAL (Reused for logic) -->
    <div id="cropper-modal" class="hidden fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <h3 class="text-white font-bold">Adjust Photo</h3>
                <button onclick="closeCropper()" class="text-white"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-4">
                <div class="relative w-full h-64 bg-black overflow-hidden rounded-lg" id="crop-container"
                        ontouchstart="startDrag(event)" ontouchmove="drag(event)" ontouchend="endDrag()"
                        onmousedown="startDrag(event)" onmousemove="drag(event)" onmouseup="endDrag()">
                    <canvas id="crop-canvas" class="absolute top-0 left-0 origin-top-left"></canvas>
                    <div class="absolute inset-0 pointer-events-none border-[50px] border-black/60 rounded-full" style="box-shadow: 0 0 0 999px rgba(0,0,0,0.6);"></div>
                </div>
                <input type="range" id="zoom-slider" min="0.5" max="3" step="0.1" value="1" class="w-full mt-4" oninput="updateZoom(this.value)">
                <button onclick="saveCrop()" class="w-full mt-4 bg-primary text-white py-3 rounded-lg font-bold">Save Photo</button>
            </div>
        </div>
    </div>
    <input type="file" id="avatar-upload" class="hidden" accept="image/*" onchange="initCropper(this)">

    <!-- MEDIA VIEWER -->
    <div id="media-viewer" class="hidden fixed inset-0 z-[80] bg-black flex flex-col justify-center items-center transition-opacity duration-300 opacity-0">
        <div class="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
            <button onclick="closeMediaViewer()" class="text-white p-2"><i class="fas fa-arrow-left text-xl"></i></button>
            <div class="flex gap-4">
                <a id="download-btn" href="#" download class="text-white p-2"><i class="fas fa-download text-xl"></i></a>
            </div>
        </div>
        <div class="media-viewer-container w-full h-full flex items-center justify-center overflow-hidden"
             ontouchstart="handlePinchStart(event)" ontouchmove="handlePinchMove(event)" ontouchend="handlePinchEnd()">
            <img id="viewer-img" src="" class="hidden max-w-full max-h-full object-contain">
            <video id="viewer-video" src="" class="hidden max-w-full max-h-full" controls playsinline></video>
        </div>
    </div>

    <!-- ADMIN PANEL -->
    <div id="admin-panel" class="hidden fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
        <div class="bg-white dark:bg-gray-800 p-4 shadow-md flex justify-between sticky top-0 z-10">
            <h2 class="text-xl font-bold text-red-600">Admin Console</h2>
            <button onclick="toggleAdminPanel()" class="text-gray-500"><i class="fas fa-times text-2xl"></i></button>
        </div>
        <div class="p-4 max-w-4xl mx-auto">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                <h3 class="font-bold mb-4 dark:text-white text-lg border-b dark:border-gray-700 pb-2">Create New User</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" id="new-user-name" placeholder="Full Name" class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg dark:text-white">
                    <input type="text" id="new-user-username" placeholder="Username" class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg dark:text-white">
                    <input type="text" id="new-user-pass" placeholder="Temp Password" class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg dark:text-white">
                </div>
                <button onclick="adminCreateUser()" class="bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-600">Create User</button>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                <h3 class="font-bold mb-4 dark:text-white">Existing Users</h3>
                <div id="admin-user-list" class="space-y-3"></div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 class="font-bold mb-4 dark:text-white">Global Actions</h3>
                <button class="w-full bg-red-100 text-red-600 py-3 rounded-lg mb-2 font-bold" onclick="alert('All chats cleared from DB')">Clear All System Chats</button>
            </div>
        </div>
    </div>

    <!-- CONTEXT MENU -->
    <div id="msg-context-menu" class="hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl z-40 context-menu p-4 pb-8">
        <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <button onclick="activateReply()" class="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white">
            <i class="fas fa-reply text-purple-500"></i> Reply
        </button>
        <button onclick="copyMessageText()" class="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white">
            <i class="fas fa-copy text-blue-500"></i> Copy Text
        </button>
        <button onclick="closeContextMenu()" class="w-full mt-2 p-3 text-center text-red-500 font-bold border rounded-lg">Cancel</button>
    </div>

    <!-- ===================== LOGIC ===================== -->
    <script>
        // --- THEME LOGIC ---
        const themes = [
            { id: 1, name: "Electric Blue", primary: "#3B82F6", secondary: "#2563EB", darkBg: "#0F172A" },
            { id: 2, name: "Neon Purple", primary: "#8B5CF6", secondary: "#7C3AED", darkBg: "#1E1E1E" },
            { id: 3, name: "Teal Cyan", primary: "#06B6D4", secondary: "#0891B2", darkBg: "#111827" },
            { id: 4, name: "Lime Green", primary: "#A3E635", secondary: "#65A30D", darkBg: "#1F2937" }
        ];

        // Load saved theme or default to #2 (Purple)
        let currentThemeId = localStorage.getItem('sTalk_theme') ? parseInt(localStorage.getItem('sTalk_theme')) : 2;

        function applyTheme(id) {
            const theme = themes.find(t => t.id === id) || themes[1];
            currentThemeId = id;
            localStorage.setItem('sTalk_theme', id);
            
            const root = document.documentElement;
            root.style.setProperty('--theme-primary', theme.primary);
            root.style.setProperty('--theme-secondary', theme.secondary);
            root.style.setProperty('--theme-dark-bg', theme.darkBg);
            
            // Update UI Swatches
            renderThemeSelector();
        }

        function renderThemeSelector() {
            const container = document.getElementById('theme-selector');
            if(!container) return;
            container.innerHTML = themes.map(t => `
                <button onclick="applyTheme(${t.id})" 
                    class="theme-swatch w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 dark:ring-offset-gray-800 ${currentThemeId === t.id ? 'selected' : 'ring-transparent'}" 
                    style="background-color: ${t.primary};" 
                    title="${t.name}">
                </button>
            `).join('');
        }

        // Initial Apply
        applyTheme(currentThemeId);


        // --- WALLPAPER LOGIC (New) ---
        function saveWallpaper(input) {
            if(!input.files[0]) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                localStorage.setItem('sTalk_bg', e.target.result);
                applyWallpaper();
                showToast("Wallpaper updated!");
            };
            reader.readAsDataURL(input.files[0]);
            input.value = "";
        }

        function removeWallpaper() {
            localStorage.removeItem('sTalk_bg');
            applyWallpaper();
            showToast("Wallpaper removed!");
        }

        function applyWallpaper() {
            const bg = localStorage.getItem('sTalk_bg');
            const container = document.getElementById('messages-container');
            if (!container) return;
            
            if(bg) {
                container.style.backgroundImage = `url('${bg}')`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
            } else {
                // Default pattern
                container.style.backgroundImage = "url('https://i.pinimg.com/originals/85/ec/df/85ecdf1c3611ecc9b7fa85282d9526e0.png')";
                container.style.backgroundSize = 'auto'; // Repeat pattern
                container.style.backgroundPosition = '0 0';
            }
        }

        // --- UTILS & HELPERS ---
        function getInitials(name) {
            return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
        }
        function renderAvatar(user, sizeClass="w-10 h-10", fontSize="text-base") {
            if (user.avatar && user.avatar.length > 10) {
                return `<img src="${user.avatar}" class="${sizeClass} object-cover w-full h-full">`;
            } else {
                return `<div class="${sizeClass} flex items-center justify-center ${fontSize}">${getInitials(user.name)}</div>`;
            }
        }

        // --- AUTH LOGIC ---
        function appLogin() {
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;
            
            server.login(u, p).then(user => {
                if (user.mustChangePassword) {
                    alert("Security: Please change your temporary password.");
                    openChangePwModal(); // reuse modal or view
                    // For simplicity in prototype, we skip to main app but force modal
                    enterMainApp(user);
                    setTimeout(openChangePwModal, 500);
                    return;
                }
                enterMainApp(user);
            }).catch(err => alert(err));
        }

        function enterMainApp(user) {
            document.getElementById('view-login').classList.add('hidden');
            document.getElementById('view-main').classList.remove('hidden');
            document.getElementById('view-main').classList.add('flex');
            
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            updateMyProfileUI();
            applyWallpaper(); // Apply wallpaper on login/init
            
            if(user.role === 'admin') document.getElementById('admin-btn').classList.remove('hidden');
            
            renderUserList();
            // Init toggle states in Settings
            document.getElementById('theme-toggle').checked = document.documentElement.classList.contains('dark');
            document.getElementById('sound-toggle').checked = soundEnabled;
            renderThemeSelector(); // ensure swatches are rendered
        }

        function updateMyProfileUI() {
            const user = server.currentUser;
            // Sidebar
            document.getElementById('my-username').innerText = user.name;
            document.getElementById('my-avatar').innerHTML = renderAvatar(user, "w-full h-full");
            
            // Settings Modal
            document.getElementById('settings-name').innerText = user.name;
            document.getElementById('settings-avatar').innerHTML = renderAvatar(user, "w-full h-full", "text-3xl");
        }

        function logout() { window.location.reload(); }

        // --- SETTINGS LOGIC ---
        function openSettingsModal() { 
            document.getElementById('settings-modal').classList.remove('hidden'); 
            renderThemeSelector();
        }
        function closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }
        
        function toggleTheme() { 
            document.documentElement.classList.toggle('dark'); 
        }
        function toggleSound() { 
            soundEnabled = !soundEnabled; 
        }
        function toggleNotifications() {
            if("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission().then(p => {
                    if(p==="granted") new Notification("sTalk", { body: "Notifications Enabled!" });
                });
            }
        }

        function openChangePwModal() { document.getElementById('change-pw-modal').classList.remove('hidden'); }
        function saveNewPassword() {
            const p = document.getElementById('cp-new').value;
            if(p.length < 4) return alert("Too short");
            server.changePassword(p).then(() => {
                alert("Password changed!");
                document.getElementById('change-pw-modal').classList.add('hidden');
            });
        }

        // --- CROPPING LOGIC ---
        let cropCanvas, cropCtx, cropImg, cropState = { scale: 1, offsetX: 0, offsetY: 0, isDragging: false };
        
        function initCropper(input) {
            if (!input.files[0]) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                cropImg = new Image(); cropImg.src = e.target.result;
                cropImg.onload = () => {
                    document.getElementById('cropper-modal').classList.remove('hidden');
                    closeSettingsModal(); // close settings to show cropper
                    cropCanvas = document.getElementById('crop-canvas'); 
                    cropCtx = cropCanvas.getContext('2d');
                    // Set dims
                    const container = document.getElementById('crop-container');
                    cropCanvas.width = container.offsetWidth;
                    cropCanvas.height = container.offsetHeight;
                    cropState = { scale: 1, offsetX: 0, offsetY: 0, isDragging: false }; 
                    drawCropper();
                };
            }; 
            reader.readAsDataURL(input.files[0]);
            input.value = ""; // reset
        }

        function closeCropper() {
            document.getElementById('cropper-modal').classList.add('hidden');
            openSettingsModal(); // return to settings
        }

        function drawCropper() {
            cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
            const w = cropImg.width * cropState.scale; 
            const h = cropImg.height * cropState.scale;
            const x = (cropCanvas.width - w)/2 + cropState.offsetX;
            const y = (cropCanvas.height - h)/2 + cropState.offsetY;
            cropCtx.drawImage(cropImg, x, y, w, h);
        }
        
        function updateZoom(val) { cropState.scale = parseFloat(val); drawCropper(); }
        function startDrag(e) { 
            cropState.isDragging = true; 
            const cx = e.touches ? e.touches[0].clientX : e.clientX; 
            const cy = e.touches ? e.touches[0].clientY : e.clientY; 
            cropState.startX = cx - cropState.offsetX; 
            cropState.startY = cy - cropState.offsetY; 
        }
        function drag(e) { 
            if (!cropState.isDragging) return; 
            e.preventDefault(); 
            const cx = e.touches ? e.touches[0].clientX : e.clientX; 
            const cy = e.touches ? e.touches[0].clientY : e.clientY; 
            cropState.offsetX = cx - cropState.startX; 
            cropState.offsetY = cy - cropState.startY; 
            drawCropper(); 
        }
        function endDrag() { cropState.isDragging = false; }

        function saveCrop() {
            const sc = document.createElement('canvas'); sc.width = 200; sc.height = 200;
            sc.getContext('2d').drawImage(cropCanvas, (cropCanvas.width/2 - 100), (cropCanvas.height/2 - 100), 200, 200, 0, 0, 200, 200);
            const res = sc.toDataURL();
            server.currentUser.avatar = res;
            server.saveUsers();
            updateMyProfileUI();
            closeCropper();
        }

        // --- APP CORE & ADMIN ---
        function adminCreateUser() {
            const name = document.getElementById('new-user-name').value;
            const user = document.getElementById('new-user-username').value;
            const pass = document.getElementById('new-user-pass').value;
            if(!name || !user || !pass) return alert("Fill all fields");
            server.createAccount(name, user, pass);
            renderUserList();
            alert(`User ${user} created!`);
        }

        function renderUserList() {
            // Regular list
            const list = document.getElementById('user-list');
            const others = server.users.filter(u => u.id !== server.currentUser.id);
            list.innerHTML = others.map(u => `
                <div onclick="openChat(${u.id})" class="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b dark:border-gray-700">
                    <div class="relative w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-gray-600 font-bold border border-gray-200 dark:border-gray-600">
                        ${renderAvatar(u, "w-full h-full", "text-lg")}
                        ${u.status === 'online' ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>' : ''}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between">
                            <h3 class="font-semibold text-gray-800 dark:text-white">${u.name}</h3>
                            <span class="text-xs text-gray-400">10:00 AM</span>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">Tap to chat</p>
                    </div>
                </div>
            `).join('');
            
            // Admin list
            const adminList = document.getElementById('admin-user-list');
            adminList.innerHTML = server.users.map(u => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-xs font-bold">
                             ${renderAvatar(u, "w-full h-full", "text-xs")}
                        </div>
                        <div><span class="dark:text-white font-medium block">${u.name}</span><span class="text-xs text-gray-400">${u.role}</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="alert('Password Reset Link Sent')" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Reset PW</button>
                        ${u.id !== server.currentUser.id ? `<button onclick="server.adminDeleteUser(${u.id}); renderUserList()" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Delete</button>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function toggleAdminPanel() { document.getElementById('admin-panel').classList.toggle('hidden'); }

        // --- CHAT LOGIC ---
        function openChat(userId) {
            activeChatId = userId;
            const user = server.users.find(u => u.id === userId);
            document.getElementById('chat-header-name').innerText = user.name;
            
            // Handle Avatar/Initials in Header
            const imgEl = document.getElementById('chat-header-avatar');
            const txtEl = document.getElementById('chat-header-initials');
            if(user.avatar && user.avatar.length > 10) {
                imgEl.src = user.avatar; imgEl.classList.remove('hidden'); txtEl.classList.add('hidden');
            } else {
                imgEl.classList.add('hidden'); txtEl.classList.remove('hidden'); txtEl.innerText = getInitials(user.name);
            }

            document.getElementById('chat-header-status').innerText = user.status === 'online' ? 'Online' : `Last seen: ${user.lastSeen}`;
            if(window.innerWidth < 768) document.getElementById('chat-interface').classList.remove('translate-x-full');
            updateUI();
            // Re-apply wallpaper when opening chat
            applyWallpaper();
        }

        function closeChat() {
            activeChatId = null;
            if(window.innerWidth < 768) document.getElementById('chat-interface').classList.add('translate-x-full');
        }

        function updateUI() {
            if (!activeChatId) return;
            const msgs = server.chats[activeChatId] || [];
            const container = document.getElementById('messages-container');
            
            container.innerHTML = msgs.map(msg => {
                const isSelf = msg.senderId === server.currentUser.id;
                const align = isSelf ? 'justify-end' : 'justify-start';
                const bg = isSelf ? 'msg-bubble-self' : 'msg-bubble-other';
                
                let tickIcon = '<i class="fas fa-check text-gray-300 text-[10px]"></i>';
                if(msg.status === 'delivered') tickIcon = '<i class="fas fa-check-double text-gray-300 text-[10px]"></i>';
                if(msg.status === 'read') tickIcon = '<i class="fas fa-check-double tick-read text-[10px]"></i>';
                
                let contentHtml = `<p class="text-sm md:text-base">${msg.text}</p>`;
                if(msg.type === 'image') {
                    contentHtml = `<img src="${msg.fileData}" class="max-w-[200px] rounded-lg cursor-pointer mb-1" onclick="openMediaViewer('${msg.fileData}', 'image')">`;
                } else if (msg.type === 'video') {
                    contentHtml = `<div class="relative max-w-[200px] cursor-pointer" onclick="openMediaViewer('${msg.fileData}', 'video')"><video src="${msg.fileData}" class="rounded-lg w-full"></video><div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"><i class="fas fa-play text-white text-2xl"></i></div></div>`;
                }
                
                let replyHtml = '';
                if(msg.replyTo) {
                    replyHtml = `<div class="bg-black/10 dark:bg-black/20 p-1 pl-2 mb-1 rounded border-l-2 border-white/50 text-xs opacity-80"><span class="font-bold block">${msg.replyTo.sender}</span><span class="truncate block max-w-[150px]">${msg.replyTo.text}</span></div>`;
                }

                return `<div class="flex ${align}" oncontextmenu="event.preventDefault(); showMsgOptions('${msg.id}')" onmousedown="startLongPress('${msg.id}')" onmouseup="cancelLongPress()" ontouchstart="startLongPress('${msg.id}')" ontouchend="cancelLongPress()"><div class="${bg} p-3 max-w-[75%] shadow-sm relative">${replyHtml}${contentHtml}<div class="text-[10px] flex justify-end items-center gap-1 opacity-80 mt-1"><span>${msg.time}</span>${isSelf ? tickIcon : ''}</div></div></div>`;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }

        function sendMsg() {
            const input = document.getElementById('msg-input');
            const text = input.value.trim();
            if(!text) return;
            server.sendMessage(activeChatId, text, 'text', null, replyContext).then(() => {
                input.value = '';
                cancelReply();
                updateUI();
            });
        }
        function triggerFileUpload() { document.getElementById('file-input').click(); }
        function handleFiles(files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const type = file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'file');
                    server.sendMessage(activeChatId, "", type, e.target.result, replyContext).then(updateUI);
                };
                reader.readAsDataURL(file);
            });
            cancelReply();
        }
        function deleteCurrentChat() {
            if(confirm("Delete this chat permanently?")) {
                server.deleteChat(activeChatId);
                closeChat();
                document.getElementById('chat-menu').classList.add('hidden');
            }
        }

        let selectedMsgId = null, pressTimer;
        function startLongPress(msgId) { pressTimer = setTimeout(() => showMsgOptions(msgId), 600); }
        function cancelLongPress() { clearTimeout(pressTimer); }
        function showMsgOptions(msgId) {
            selectedMsgId = msgId;
            document.getElementById('msg-context-menu').classList.remove('hidden');
            if(navigator.vibrate) navigator.vibrate(50);
        }
        function closeContextMenu() { document.getElementById('msg-context-menu').classList.add('hidden'); }
        function activateReply() {
            closeContextMenu();
            const msgs = server.chats[activeChatId];
            const original = msgs.find(m => m.id === selectedMsgId);
            replyContext = { id: original.id, text: original.type === 'text' ? original.text : `[${original.type}]`, sender: original.senderId === server.currentUser.id ? "You" : "Them" };
            document.getElementById('reply-preview').classList.remove('hidden');
            document.getElementById('reply-text').innerText = replyContext.text;
            document.getElementById('msg-input').focus();
        }
        function cancelReply() { replyContext = null; document.getElementById('reply-preview').classList.add('hidden'); }
        function copyMessageText() {
             closeContextMenu();
             const msgs = server.chats[activeChatId];
             const original = msgs.find(m => m.id === selectedMsgId);
             if(original.text) { navigator.clipboard.writeText(original.text); showToast("Copied"); }
        }

        let currentZoom = 1;
        function openMediaViewer(src, type) {
            const v = document.getElementById('media-viewer');
            v.classList.remove('hidden');
            setTimeout(() => v.classList.remove('opacity-0'), 10);
            document.getElementById('download-btn').href = src;
            if(type==='image'){ document.getElementById('viewer-img').src = src; document.getElementById('viewer-img').classList.remove('hidden'); document.getElementById('viewer-video').classList.add('hidden'); }
            else { document.getElementById('viewer-video').src = src; document.getElementById('viewer-video').classList.remove('hidden'); document.getElementById('viewer-img').classList.add('hidden'); }
        }
        function closeMediaViewer() {
            const v = document.getElementById('media-viewer');
            v.classList.add('opacity-0');
            setTimeout(() => { v.classList.add('hidden'); document.getElementById('viewer-video').pause(); document.getElementById('viewer-video').src = ""; }, 300);
        }
        
        let initialDistance = 0;
        function handlePinchStart(e) { if (e.touches.length === 2) initialDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY); }
        function handlePinchMove(e) { if (e.touches.length === 2) { const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY); const delta = dist / initialDistance; currentZoom = Math.min(Math.max(1, delta * currentZoom), 4); const el = document.querySelector('.media-viewer-container img:not(.hidden), .media-viewer-container video:not(.hidden)'); if(el) el.style.transform = `scale(${currentZoom})`; } }
        function handlePinchEnd() { initialDistance = 0; }

        function showToast(msg) { const t = document.createElement('div'); t.className = "fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-[100] text-sm animate-bounce"; t.innerText = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
    </script>
</body>
</html>