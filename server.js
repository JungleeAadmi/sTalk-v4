const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA (Single Page Application) logic
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 sTalk Server is running!`);
    console.log(`📱 Local Access:   http://localhost:${PORT}`);
    console.log(`🌐 Network Access: http://<your-proxmox-ip>:${PORT}`);
    console.log(`--------------------------------------------------\n`);
});