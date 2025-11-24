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

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e9 });

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use(cors());
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
app.use(express.static(__dirname)); 
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    acceptRanges: true,
    setHeaders: (res, path) => { res.set('Access-Control-Allow-Origin', '*'); }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });

// --- VAPID SETUP ---
let vapidKeys;
try {
    if (!fs.existsSync(VAPID_PATH)) {
      console.log("Generating VAPID Keys...");
      vapidKeys = webpush.generateVAPIDKeys();
      fs.writeFileSync(VAPID_PATH, JSON.stringify(vapidKeys, null, 2));
    } else {
      vapidKeys = JSON.parse(fs.readFileSync(VAPID_PATH));
    }
    webpush.setVapidDetails('mailto:admin@littleguy.duckdns.org', vapidKeys.publicKey, vapidKeys.privateKey);
} catch (err) {
    console.error("CRITICAL: VAPID Key Error. Delete vapid.json and restart.", err);
}

// --- SAFE DB HELPER ---
const getDb = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            console.warn("⚠️ Database missing, returning empty.");
            return { users: [], chats: [] };
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        if (!data.trim()) {
             console.warn("⚠️ Database empty, returning structure.");
             return { users: [], chats: [] };
        }
        const db = JSON.parse(data);
        // Ensure structure exists
        if (!db.users) db.users = [];
        if (!db.chats) db.chats = [];
        return db;
    } catch (err) {
        console.error("❌ DATABASE CORRUPTION DETECTED:", err.message);
        return { users: [], chats: [] }; // Return safe empty DB to prevent crash
    }
};

const saveDb = (data) => {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } 
    catch(e) { console.error("DB Write Error", e); }
};

// --- API ROUTES ---

app.get('/api/vapid-key', (req, res) => res.json({ key: vapidKeys.publicKey }));

// DEBUG LOGIN ROUTE
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Login Attempt: ${username}`);
    
    const db = getDb();
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if(user) {
        console.log(`✅ Login Success: ${username}`);
        res.json({ success: true, user });
    } else {
        console.warn(`❌ Login Failed: ${username} (Invalid Credentials or User Missing)`);
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// ... (Rest of the routes maintained from previous reliable version) ...

app.post('/api/subscribe', (req, res) => {
    const { userId, subscription } = req.body;
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx > -1) {
        if (!db.users[idx].pushSubscriptions) db.users[idx].pushSubscriptions = [];
        const exists = db.users[idx].pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            db.users[idx].pushSubscriptions.push(subscription);
            saveDb(db);
        }
        res.json({ success: true });
    } else res.status(404).json({ error: "User not found" });
});

app.post('/api/push/test', (req, res) => {
    const { userId } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    const subs = user?.pushSubscriptions || (user?.pushSubscription ? [user.pushSubscription] : []);
    
    if (subs.length === 0) return res.status(400).json({ error: "No devices found." });

    const payload = JSON.stringify({ title: "sTalk Test", body: "Testing All Devices!", url: "/" });
    
    const promises = subs.map(sub => 
        webpush.sendNotification(sub, payload)
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, err: err.statusCode }))
    );

    Promise.all(promises).then(results => {
        const successCount = results.filter(r => r.success).length;
        res.json({ success: true, count: successCount });
    });
});

app.get('/api/me', (req, res) => {
    const userId = req.query.id;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if(user) res.json({ success: true, user });
    else res.status(404).json({ success: false });
});

app.get('/api/chat/history', (req, res) => {
    const { userId, otherId } = req.query;
    const db = getDb();
    const chat = db.chats.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
    res.json(chat ? chat.messages : []);
});

app.get('/api/users/search', (req, res) => {
    const { q, currentUserId } = req.query;
    const db = getDb();
    const results = db.users
        .filter(u => u.id !== currentUserId && (u.username.includes(q) || (u.name && u.name.includes(q))))
        .map(u => {
            const chat = db.chats.find(c => c.participants.includes(currentUserId) && c.participants.includes(u.id));
            let unread = 0;
            if(chat) unread = chat.messages.filter(m => m.senderId === u.id && m.status !== 'read').length;
            return { id: u.id, name: u.name || u.username, avatar: u.avatar, isOnline: u.isOnline, lastSeen: u.lastSeen, unread };
        });
    res.json(results);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if(req.file) res.json({ url: `/uploads/${req.file.filename}` });
  else res.status(400).json({ error: 'Error uploading' });
});

app.post('/api/user/update', (req, res) => {
    const { userId, updates } = req.body;
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if(idx > -1) {
       if(updates.settings) {
         db.users[idx].settings = { ...db.users[idx].settings, ...updates.settings };
         delete updates.settings;
       }
       db.users[idx] = { ...db.users[idx], ...updates };
       saveDb(db);
       io.emit('user_updated', { userId, user: db.users[idx] });
       res.json({ success: true, user: db.users[idx] });
    } else res.status(404).json({ error: "User not found" });
});

app.post('/api/user/change-password', (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if(user && user.password === oldPassword) {
        user.password = newPassword;
        saveDb(db);
        res.json({ success: true });
    } else res.status(400).json({ error: "Incorrect password" });
});

app.get('/api/admin/users', (req, res) => {
    const db = getDb();
    const safeUsers = db.users.map(({password, ...u}) => u);
    res.json(safeUsers);
});

app.post('/api/admin/create-user', (req, res) => {
    const { username, name, password } = req.body;
    const db = getDb();
    if(db.users.find(u => u.username === username)) return res.status(400).json({ error: "User exists" });
    const newUser = {
      id: uuidv4(), username, name: name || username, password, role: 'user', avatar: null,
      settings: { notifications: true, theme: '#2563eb', wallpaper: null, darkMode: false },
      isOnline: false, lastSeen: null, pushSubscriptions: []
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
    } else res.status(404).json({ error: "User not found" });
});

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  let currentUserId = null;
  socket.on('join', (userId) => {
      currentUserId = userId;
      socket.join(userId);
      const db = getDb();
      const user = db.users.find(u => u.id === userId);
      if(user) { user.isOnline = true; saveDb(db); io.emit('status_update', { userId, isOnline: true }); }
  });

  socket.on('send_message', (data) => {
    const db = getDb();
    let chat = db.chats.find(c => c.participants.includes(data.senderId) && c.participants.includes(data.recipientId));
    if(!chat) {
        chat = { id: uuidv4(), participants: [data.senderId, data.recipientId], messages: [] };
        db.chats.push(chat);
    }
    const recipient = db.users.find(u => u.id === data.recipientId);
    const initialStatus = recipient && recipient.isOnline ? 'delivered' : 'sent';
    const newMsg = { ...data.message, id: uuidv4(), status: initialStatus, timestamp: new Date().toISOString() };
    chat.messages.push(newMsg);
    saveDb(db);
    io.to(data.recipientId).emit('receive_message', { chatId: chat.id, message: newMsg });
    io.to(data.senderId).emit('message_sent_confirm', { tempId: data.message.id, finalMsg: { ...newMsg, isMe: true } });

    const subs = recipient?.pushSubscriptions || (recipient?.pushSubscription ? [recipient.pushSubscription] : []);
    if(subs.length > 0) {
        const senderName = db.users.find(u => u.id === data.senderId)?.name || "Someone";
        const payload = JSON.stringify({ 
            title: senderName, 
            body: newMsg.type === 'image' ? 'Sent a photo' : (newMsg.type === 'video' ? 'Sent a video' : (newMsg.type === 'audio' ? 'Sent a voice note' : newMsg.text)),
            url: '/' 
        });
        subs.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) console.log(`Removing dead sub`);
            });
        });
    }
  });

  socket.on('edit_message', ({ messageId, newText }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.messages.some(m => String(m.id) === String(messageId)));
      if(chat) {
          const msg = chat.messages.find(m => String(m.id) === String(messageId));
          if(msg) {
              msg.text = newText;
              msg.isEdited = true;
              saveDb(db);
              chat.participants.forEach(p => io.to(p).emit('message_updated', msg));
          }
      }
  });

  socket.on('delete_message', ({ messageId }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.messages.some(m => String(m.id) === String(messageId)));
      if(chat) {
          chat.messages = chat.messages.filter(m => String(m.id) !== String(messageId));
          saveDb(db);
          chat.participants.forEach(p => io.to(p).emit('message_deleted', { messageId }));
      }
  });

  socket.on('add_reaction', ({ chatId, messageId, emoji, userId }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.messages.some(m => String(m.id) === String(messageId)));
      if(chat) {
          const msg = chat.messages.find(m => String(m.id) === String(messageId));
          if(msg) {
              if(!msg.reactions) msg.reactions = {};
              if(msg.reactions[userId] === emoji) delete msg.reactions[userId];
              else msg.reactions[userId] = emoji;
              saveDb(db);
              chat.participants.forEach(p => io.to(p).emit('message_updated', msg));
          }
      }
  });

  socket.on('typing', ({ to, isTyping }) => {
      io.to(to).emit('typing_status', { from: currentUserId, isTyping });
  });

  socket.on('mark_read', ({ userId, otherId }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.participants.includes(userId) && c.participants.includes(otherId));
      if(chat) {
          let updated = false;
          chat.messages.forEach(m => { if(m.senderId === otherId && m.status !== 'read') { m.status = 'read'; updated = true; } });
          if(updated) { saveDb(db); io.to(otherId).emit('messages_were_read', { by: userId }); }
      }
  });

  socket.on('disconnect', () => {
    if(currentUserId) {
        const db = getDb();
        const user = db.users.find(u => u.id === currentUserId);
        if(user) { user.isOnline = false; user.lastSeen = new Date().toISOString(); saveDb(db); io.emit('status_update', { userId: currentUserId, isOnline: false, lastSeen: user.lastSeen }); }
    }
  });
});

server.listen(PORT, () => { console.log(`✅ sTalk Server Running on ${PORT}`); });