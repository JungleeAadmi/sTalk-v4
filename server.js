const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const VAPID_FILE = path.join(__dirname, 'vapid.json');

// MIDDLEWARE - Increased limit for large profile images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- VAPID KEYS (Push Notifications) ---
let vapidKeys = { publicKey: '', privateKey: '' };

if (fs.existsSync(VAPID_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE));
} else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
    console.log("✅ NEW VAPID KEYS GENERATED");
}

webpush.setVapidDetails(
    'mailto:admin@stalk.local',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// --- DATABASE ---
let db = {
    users: [
        { 
            id: 1, 
            username: "admin", 
            password: "admin", 
            name: "System Admin", 
            avatar: "", 
            role: "admin", 
            mustChangePassword: false, 
            status: "offline",
            unread: {} 
        }
    ],
    chats: {},
    subscriptions: {} // Map userId -> [subscription]
};

if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE);
        db = { ...db, ...JSON.parse(data) };
    } catch (e) { console.error("DB Load Error, starting fresh."); }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- ROUTES ---

// Push: Get Public Key
app.get('/api/push/key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

// Push: Subscribe
app.post('/api/push/subscribe', (req, res) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription || !subscription.endpoint) return res.status(400).json({error: "Invalid data"});

    if (!db.subscriptions[userId]) db.subscriptions[userId] = [];
    
    // Prevent duplicates
    const existing = db.subscriptions[userId].findIndex(s => s.endpoint === subscription.endpoint);
    if (existing === -1) {
        db.subscriptions[userId].push(subscription);
        saveDB();
    }
    
    res.json({ success: true });
});

// Auth: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
        user.status = "online";
        user.lastSeen = "Online";
        saveDB();
        io.emit('users_update', db.users.map(u => ({...u, password: ""})));
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Users: Create
app.post('/api/users', (req, res) => {
    const { name, username, password } = req.body;
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Username taken" });
    }
    
    const newUser = {
        id: Date.now(),
        username, password, name,
        avatar: "", role: "user",
        mustChangePassword: true,
        status: "offline", lastSeen: "Never",
        unread: {}
    };
    
    db.users.push(newUser);
    saveDB();
    io.emit('users_update', db.users.map(u => ({...u, password: ""}))); 
    res.json({ success: true, user: newUser });
});

// Users: List
app.get('/api/users', (req, res) => {
    const safeUsers = db.users.map(u => ({...u, password: ""}));
    res.json(safeUsers);
});

// Users: Update (Avatar/Password)
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIdx = db.users.findIndex(u => u.id === userId);
    
    if (userIdx !== -1) {
        if (req.body.avatar !== undefined) db.users[userIdx].avatar = req.body.avatar;
        if (req.body.password) {
            db.users[userIdx].password = req.body.password;
            db.users[userIdx].mustChangePassword = false;
        }
        saveDB();
        io.emit('users_update', db.users.map(u => ({...u, password: ""})));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// Users: Delete
app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.users = db.users.filter(u => u.id !== id);
    delete db.subscriptions[id]; // Clean up subs
    saveDB();
    io.emit('users_update', db.users.map(u => ({...u, password: ""})));
    res.json({ success: true });
});

// Chats: Get History
app.get('/api/chats/:userId', (req, res) => {
    const chatId = req.query.chatId;
    res.json(db.chats[chatId] || []);
});

// Chats: Read
app.post('/api/chats/read', (req, res) => {
    const { userId, senderId, chatId } = req.body;
    
    // 1. Reset unread count
    const user = db.users.find(u => u.id === userId);
    if (user) {
        if (!user.unread) user.unread = {};
        user.unread[senderId] = 0;
    }
    
    // 2. Mark messages as 'read'
    if (db.chats[chatId]) {
        db.chats[chatId].forEach(m => {
            if (m.senderId === senderId) m.status = 'read';
        });
        // Notify the SENDER that their messages were read
        io.to(chatId).emit('messages_read', { chatId });
    }

    saveDB();
    io.emit('users_update', db.users.map(u => ({...u, password: ""}))); 
    res.json({ success: true });
});

// Chats: Send Message & Push Notification
app.post('/api/messages', (req, res) => {
    const { chatId, message, recipientId } = req.body;
    if (!db.chats[chatId]) db.chats[chatId] = [];
    
    message.sentAt = new Date().toISOString();
    message.status = 'sent'; // Initial status
    
    db.chats[chatId].push(message);

    // Update Unread
    const recipient = db.users.find(u => u.id === recipientId);
    if (recipient) {
        if (!recipient.unread) recipient.unread = {};
        recipient.unread[message.senderId] = (recipient.unread[message.senderId] || 0) + 1;
    }

    saveDB();
    
    // Send via Socket
    io.to(chatId).emit('message_received', message);
    
    // Mark as delivered immediately if socket sent ok (simplified)
    // In reality, client ack sets this, but we'll simulate:
    setTimeout(() => {
        const msgRef = db.chats[chatId].find(m => m.id === message.id);
        if(msgRef && msgRef.status === 'sent') {
            msgRef.status = 'delivered';
            saveDB();
            io.to(chatId).emit('message_status_update', { id: message.id, status: 'delivered', chatId });
        }
    }, 1000);

    io.emit('users_update', db.users.map(u => ({...u, password: ""})));

    // --- PUSH NOTIFICATION LOGIC ---
    if (db.subscriptions[recipientId] && db.subscriptions[recipientId].length > 0) {
        const sender = db.users.find(u => u.id === message.senderId);
        const senderName = sender ? sender.name : "Someone";
        
        const payload = JSON.stringify({
            title: `New message from ${senderName}`,
            body: message.text || (message.type === 'image' ? 'Sent an image' : 'Sent a file'),
            icon: '/logo.svg',
            url: '/',
            data: { chatId: chatId, senderId: message.senderId }
        });

        db.subscriptions[recipientId].forEach((sub, index) => {
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    db.subscriptions[recipientId].splice(index, 1);
                    saveDB();
                }
                console.error("Push Error:", err.statusCode);
            });
        });
    }

    res.json({ success: true, message });
});

// Admin: Reset PW
app.post('/api/admin/reset-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const user = db.users.find(u => u.id === parseInt(userId));
    if(user) {
        user.password = newPassword;
        user.mustChangePassword = true;
        saveDB();
        res.json({success: true});
    } else {
        res.status(404).json({success: false});
    }
});

// Admin: Clear
app.post('/api/admin/clear-chats', (req, res) => {
    db.chats = {};
    db.users.forEach(u => u.unread = {});
    saveDB();
    io.emit('chats_cleared');
    io.emit('users_update', db.users.map(u => ({...u, password: ""})));
    res.json({success: true});
});

// Socket
io.on('connection', (socket) => {
    socket.on('join_room', (id) => socket.join(id));
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`sTalk Server running on port ${PORT}`);
});