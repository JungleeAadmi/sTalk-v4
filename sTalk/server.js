const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const DB_PATH = './database.json';
const VAPID_PATH = './vapid.json';
const UPLOAD_DIR = './uploads';

// --- INITIALIZATION ---
const app = express();
const server = http.createServer(app);
// Increase Socket buffer for large data (1GB)
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e9 
});

// Ensure Upload Directory Exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// --- MIDDLEWARE & LIMITS ---
app.use(cors());

// 1. INCREASE DATA LIMITS (Fix for "VGA Quality" & Large Files)
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// 2. STATIC FILES
// Serve Root (for logo.svg, logo.png, manifest.json)
app.use(express.static(__dirname)); 
// Serve React App
app.use(express.static(path.join(__dirname, 'client/dist')));
// Serve Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- FILE UPLOAD STORAGE (High Quality) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Allow files up to 1GB
const upload = multer({ 
    storage, 
    limits: { fileSize: 1024 * 1024 * 1024 } 
});

// --- VAPID (PUSH NOTIFICATIONS) ---
let vapidKeys;
if (!fs.existsSync(VAPID_PATH)) {
  console.log("Generating VAPID Keys...");
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_PATH, JSON.stringify(vapidKeys, null, 2));
} else {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_PATH));
}
webpush.setVapidDetails('mailto:admin@stalk.local', vapidKeys.publicKey, vapidKeys.privateKey);

// --- DATABASE HELPERS ---
const getDb = () => {
    if (!fs.existsSync(DB_PATH)) return { users: [], chats: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

const saveDb = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log("💾 Database Saved Successfully"); 
    } catch(err) {
        console.error("❌ Database Save Failed:", err);
    }
};

// --- API ROUTES ---

// Get VAPID Public Key
app.get('/api/vapid-key', (req, res) => res.json({ key: vapidKeys.publicKey }));

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.username === username && u.password === password);
    if(user) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Sync User Data (Called on Reload to fix Persistence)
app.get('/api/me', (req, res) => {
    const userId = req.query.id;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if(user) res.json({ success: true, user });
    else res.status(404).json({ success: false });
});

// Get Chat History
app.get('/api/chat/history', (req, res) => {
    const { userId, otherId } = req.query;
    const db = getDb();
    const chat = db.chats.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
    res.json(chat ? chat.messages : []);
});

// Search Users (Sidebar List)
app.get('/api/users/search', (req, res) => {
    const { q, currentUserId } = req.query;
    const db = getDb();
    
    const results = db.users
        .filter(u => u.id !== currentUserId && (u.username.includes(q) || (u.name && u.name.includes(q))))
        .map(u => {
            // Calculate Unread
            const chat = db.chats.find(c => c.participants.includes(currentUserId) && c.participants.includes(u.id));
            let unread = 0;
            if(chat) {
                unread = chat.messages.filter(m => m.senderId === u.id && m.status !== 'read').length;
            }
            return { 
                id: u.id, 
                name: u.name || u.username, 
                avatar: u.avatar, 
                isOnline: u.isOnline,
                lastSeen: u.lastSeen,
                unread 
            };
        });
    res.json(results);
});

// Upload File (Image/Video)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if(req.file) {
    res.json({ url: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: 'No file uploaded or file too large' });
  }
});

// --- USER MANAGEMENT ROUTES ---

// Update User (Theme, Avatar, Settings)
app.post('/api/user/update', (req, res) => {
    const { userId, updates } = req.body;
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    
    if(idx > -1) {
       // Merge Settings deeply
       if(updates.settings) {
         db.users[idx].settings = { ...db.users[idx].settings, ...updates.settings };
         delete updates.settings;
       }
       // Merge User Data
       db.users[idx] = { ...db.users[idx], ...updates };
       
       saveDb(db);
       
       // BROADCAST update so persistence works across devices instantly
       io.emit('user_updated', { userId, user: db.users[idx] });
       
       res.json({ success: true, user: db.users[idx] });
    } else {
       res.status(404).json({ error: "User not found" });
    }
});

// Change Password
app.post('/api/user/change-password', (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    
    if(user && user.password === oldPassword) {
        user.password = newPassword;
        saveDb(db);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Incorrect old password" });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/users', (req, res) => {
    const db = getDb();
    // Return users without passwords
    const safeUsers = db.users.map(({password, ...u}) => u);
    res.json(safeUsers);
});

app.post('/api/admin/create-user', (req, res) => {
    const { username, name, password } = req.body;
    const db = getDb();
    if(db.users.find(u => u.username === username)) return res.status(400).json({ error: "User exists" });
    
    const newUser = {
      id: uuidv4(),
      username,
      name: name || username,
      password,
      role: 'user',
      avatar: null,
      settings: { notifications: true, theme: '#2563eb', wallpaper: null, darkMode: false },
      isOnline: false,
      lastSeen: null
    };
    db.users.push(newUser);
    saveDb(db);
    res.json({ success: true, user: newUser });
});

app.post('/api/admin/delete-user', (req, res) => {
    const { targetUserId } = req.body;
    let db = getDb();
    db.users = db.users.filter(u => u.id !== targetUserId);
    db.chats = db.chats.filter(c => !c.participants.includes(targetUserId));
    saveDb(db);
    res.json({ success: true });
});

app.post('/api/admin/reset-password', (req, res) => {
    const { targetUserId, newPassword } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === targetUserId);
    if(user) {
        user.password = newPassword;
        saveDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

// --- REAL-TIME ENGINE (SOCKET.IO) ---

io.on('connection', (socket) => {
  let currentUserId = null;

  // User comes online
  socket.on('join', (userId) => {
      currentUserId = userId;
      socket.join(userId);
      
      const db = getDb();
      const user = db.users.find(u => u.id === userId);
      if(user) {
          user.isOnline = true;
          saveDb(db);
          io.emit('status_update', { userId, isOnline: true });
      }
  });

  // Handle Messaging
  socket.on('send_message', (data) => {
    const db = getDb();
    
    // Find or Create Chat
    let chat = db.chats.find(c => c.participants.includes(data.senderId) && c.participants.includes(data.recipientId));
    if(!chat) {
        chat = { id: uuidv4(), participants: [data.senderId, data.recipientId], messages: [] };
        db.chats.push(chat);
    }

    // Check Recipient Status
    const recipient = db.users.find(u => u.id === data.recipientId);
    const initialStatus = recipient && recipient.isOnline ? 'delivered' : 'sent';

    // Create Message Object
    const newMsg = { 
        ...data.message, 
        id: uuidv4(), // Ensure unique ID
        status: initialStatus, 
        timestamp: new Date().toISOString() 
    };
    
    chat.messages.push(newMsg);
    saveDb(db);

    // Emit to Recipient
    io.to(data.recipientId).emit('receive_message', { 
        chatId: chat.id, 
        message: newMsg 
    });

    // Confirm to Sender (Send back the final message with ID and Status)
    io.to(data.senderId).emit('message_sent_confirm', { 
        tempId: data.message.id, // The ID client generated
        finalMsg: { ...newMsg, isMe: true } 
    });
    
    // Send Push Notification if recipient is offline
    if(recipient && recipient.pushSubscription && !recipient.isOnline) {
        const payload = JSON.stringify({ title: 'New Message', body: `Message from ${data.senderId}` });
        webpush.sendNotification(recipient.pushSubscription, payload).catch(err => console.error(err));
    }
  });

  // Mark Messages as Read
  socket.on('mark_read', ({ userId, otherId }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
      
      if(chat) {
          let updated = false;
          // Mark all messages FROM otherId as read
          chat.messages.forEach(m => {
              if(m.senderId === otherId && m.status !== 'read') {
                  m.status = 'read';
                  updated = true;
              }
          });

          if(updated) {
              saveDb(db);
              // Tell the sender their messages were read
              io.to(otherId).emit('messages_were_read', { by: userId });
          }
      }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    if(currentUserId) {
        const db = getDb();
        const user = db.users.find(u => u.id === currentUserId);
        if(user) {
            user.isOnline = false;
            user.lastSeen = new Date().toISOString();
            saveDb(db);
            io.emit('status_update', { 
                userId: currentUserId, 
                isOnline: false, 
                lastSeen: user.lastSeen 
            });
        }
    }
  });
});

// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`✅ sTalk Server Running on Port ${PORT}`);
  console.log(`📂 Storage Limit: 1GB`);
});
