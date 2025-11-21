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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large image uploads
app.use(express.static(path.join(__dirname, 'public')));

// --- VAPID KEYS (Push Notifications) ---
let vapidKeys = { publicKey: '', privateKey: '' };

if (fs.existsSync(VAPID_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE));
} else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
    console.log("Generated new VAPID Keys");
}

webpush.setVapidDetails(
    'mailto:admin@stalk.local',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// --- DATABASE SYSTEM ---
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
            unread: {} // Store unread counts { senderId: count }
        }
    ],
    chats: {},
    subscriptions: {} // { userId: [subscriptionObject, ...] }
};

// Load DB
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE);
        const loaded = JSON.parse(data);
        // Merge to ensure structure structure exists
        db = { ...db, ...loaded };
    } catch (e) { console.error("Error loading DB, starting fresh."); }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- API ROUTES ---

// Get VAPID Key
app.get('/api/push/key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to Push
app.post('/api/push/subscribe', (req, res) => {
    const { userId, subscription } = req.body;
    if (!db.subscriptions[userId]) db.subscriptions[userId] = [];
    
    // Add if not exists
    const exists = db.subscriptions[userId].find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        db.subscriptions[userId].push(subscription);
        saveDB();
    }
    res.json({ success: true });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
        user.status = "online";
        user.lastSeen = "Online";
        saveDB();
        io.emit('user_status_update', { userId: user.id, status: "online" });
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Create User
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

// Get Users (With Unread Counts)
app.get('/api/users', (req, res) => {
    // Ideally we filter this per requester, but for simplicity we send safe objects
    // The client filters 'unread' counts relevant to themselves
    const safeUsers = db.users.map(u => ({...u, password: ""}));
    res.json(safeUsers);
});

// Clear Unread
app.post('/api/chats/read', (req, res) => {
    const { userId, senderId } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (user && user.unread) {
        user.unread[senderId] = 0;
        saveDB();
        // Notify user their unread count changed
        // In a real app we'd send this only to the specific socket
        io.emit('users_update', db.users.map(u => ({...u, password: ""}))); 
    }
    res.json({ success: true });
});

// Update User
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

app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.users = db.users.filter(u => u.id !== id);
    saveDB();
    io.emit('users_update', db.users.map(u => ({...u, password: ""})));
    res.json({ success: true });
});

app.get('/api/chats/:userId', (req, res) => {
    const chatId = req.query.chatId;
    res.json(db.chats[chatId] || []);
});

// Send Message
app.post('/api/messages', (req, res) => {
    const { chatId, message, recipientId } = req.body;
    if (!db.chats[chatId]) db.chats[chatId] = [];
    
    message.sentAt = new Date().toISOString();
    message.status = 'sent';
    
    db.chats[chatId].push(message);

    // Increment unread count for recipient
    const recipient = db.users.find(u => u.id === recipientId);
    if (recipient) {
        if (!recipient.unread) recipient.unread = {};
        recipient.unread[message.senderId] = (recipient.unread[message.senderId] || 0) + 1;
    }

    saveDB();
    
    io.to(chatId).emit('message_received', message);
    
    // Trigger global update to show unread count badge immediately
    io.emit('users_update', db.users.map(u => ({...u, password: ""})));

    // SEND PUSH NOTIFICATION
    if (db.subscriptions[recipientId]) {
        const sender = db.users.find(u => u.id === message.senderId);
        const payload = JSON.stringify({
            title: sender ? sender.name : 'New Message',
            body: message.text || 'Sent a file',
            icon: 'logo.svg',
            url: '/'
        });

        db.subscriptions[recipientId].forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error("Push failed", err);
                // Optionally remove dead subscription here
            });
        });
    }

    res.json({ success: true, message });
});

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

app.post('/api/admin/clear-chats', (req, res) => {
    db.chats = {};
    db.users.forEach(u => u.unread = {}); // Clear unread too
    saveDB();
    io.emit('chats_cleared');
    io.emit('users_update', db.users.map(u => ({...u, password: ""})));
    res.json({success: true});
});

io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => socket.join(roomId));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`sTalk Server running on port ${PORT}`);
});