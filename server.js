const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large image uploads
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE SYSTEM ---
let db = {
    users: [
        // Default Admin: admin / admin
        { id: 1, username: "admin", password: "admin", name: "System Admin", avatar: "", role: "admin", mustChangePassword: false, status: "offline" }
    ],
    chats: {}
};

// Load DB if exists
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE);
        db = JSON.parse(data);
    } catch (e) {
        console.error("Error loading DB, starting fresh.");
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- API ROUTES ---

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

// Create User (Admin only logic handled by client for simplicity, verified here)
app.post('/api/users', (req, res) => {
    const { name, username, password } = req.body;
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Username taken" });
    }
    
    const newUser = {
        id: Date.now(),
        username,
        password,
        name,
        avatar: "",
        role: "user",
        mustChangePassword: true, // Force PW change
        status: "offline",
        lastSeen: "Never"
    };
    
    db.users.push(newUser);
    saveDB();
    io.emit('users_update', db.users); // Refresh lists for everyone
    res.json({ success: true, user: newUser });
});

// Get Users
app.get('/api/users', (req, res) => {
    // Return users without passwords for security
    const safeUsers = db.users.map(u => ({...u, password: ""}));
    res.json(safeUsers);
});

// Update User (Avatar, Password)
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIdx = db.users.findIndex(u => u.id === userId);
    
    if (userIdx !== -1) {
        // Only update allowed fields
        if (req.body.avatar) db.users[userIdx].avatar = req.body.avatar;
        if (req.body.password) {
            db.users[userIdx].password = req.body.password;
            db.users[userIdx].mustChangePassword = false;
        }
        saveDB();
        io.emit('users_update', db.users);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// Delete User (Admin)
app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.users = db.users.filter(u => u.id !== id);
    saveDB();
    io.emit('users_update', db.users);
    res.json({ success: true });
});

// Messages
app.get('/api/chats/:userId', (req, res) => {
    // In this simple model, we just return the chat object between current user and requested user
    // Real apps would use a more complex query
    const chatId = req.query.chatId; // Expecting a unique key for the pair
    res.json(db.chats[chatId] || []);
});

app.post('/api/messages', (req, res) => {
    const { chatId, message } = req.body;
    if (!db.chats[chatId]) db.chats[chatId] = [];
    
    // Add server timestamp
    message.sentAt = new Date().toISOString();
    message.status = 'sent';
    
    db.chats[chatId].push(message);
    saveDB();
    
    // Real-time send
    io.to(chatId).emit('message_received', message);
    res.json({ success: true, message });
});

// Admin Reset Password
app.post('/api/admin/reset-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const user = db.users.find(u => u.id === parseInt(userId));
    if(user) {
        user.password = newPassword;
        user.mustChangePassword = true; // Force them to change it again
        saveDB();
        res.json({success: true});
    } else {
        res.status(404).json({success: false});
    }
});

// Clear All Chats
app.post('/api/admin/clear-chats', (req, res) => {
    db.chats = {};
    saveDB();
    io.emit('chats_cleared');
    res.json({success: true});
});

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('disconnect', () => {
        // In a real app, we'd map socket ID to user ID to set them offline
        console.log('User disconnected');
    });
});

// Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`sTalk Server running on port ${PORT}`);
});