const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

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

let vapidKeys;
if (!fs.existsSync(VAPID_PATH)) {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_PATH, JSON.stringify(vapidKeys, null, 2));
} else {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_PATH));
}
webpush.setVapidDetails('mailto:admin@littleguy.duckdns.org', vapidKeys.publicKey, vapidKeys.privateKey);

const getDb = () => {
    if (!fs.existsSync(DB_PATH)) return { users: [], chats: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};
const saveDb = (data) => {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } 
    catch(e) { console.error("DB Error", e); }
};

// ... (Standard API routes omitted for brevity, same as previous) ...
// PASTE API ROUTES BLOCK HERE IF NOT USING GITHUB SYNC
// Assume standard routes (login, me, history, search, upload, user/update, admin/*) exist as before.

// Socket Logic
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

    // Push
    const subs = recipient?.pushSubscriptions || (recipient?.pushSubscription ? [recipient.pushSubscription] : []);
    if(subs.length > 0) {
        const senderName = db.users.find(u => u.id === data.senderId)?.name || "Someone";
        const payload = JSON.stringify({ 
            title: senderName, 
            body: newMsg.type === 'image' ? 'Sent a photo' : (newMsg.type === 'video' ? 'Sent a video' : (newMsg.type === 'audio' ? 'Sent a voice note' : newMsg.text)),
            url: '/' 
        });
        subs.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(() => {});
        });
    }
  });

  // ROBUST EDIT
  socket.on('edit_message', ({ messageId, newText }) => {
      const db = getDb();
      // Loose comparison for ID (String/Number)
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

  // ROBUST DELETE
  socket.on('delete_message', ({ messageId }) => {
      const db = getDb();
      const chat = db.chats.find(c => c.messages.some(m => String(m.id) === String(messageId)));
      if(chat) {
          chat.messages = chat.messages.filter(m => String(m.id) !== String(messageId));
          saveDb(db);
          chat.participants.forEach(p => io.to(p).emit('message_deleted', { messageId }));
      }
  });

  // ... (Keep mark_read, reaction, disconnect, etc) ...
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