import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Trash2, Play, Camera } from 'lucide-react';
import Avatar from './Avatar';
import MediaViewer from './MediaViewer';
import CameraModal from './CameraModal';

// Helper: Turn URLs into clickable links
const Linkify = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => 
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">
        {part}
      </a>
    ) : part
  );
};

const ChatView = ({ activeUser, currentUser, socket, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMedia, setViewMedia] = useState(null); 
  const [showCamera, setShowCamera] = useState(false); 
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper: Detect Type
  const getFileType = (msg) => {
    if (msg.type === 'video') return 'video';
    if (msg.type === 'image') return 'image';
    const ext = msg.fileUrl?.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'text';
  };

  const markRead = () => {
    socket.emit('mark_read', { userId: currentUser.id, otherId: activeUser.id });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`/api/chat/history?userId=${currentUser.id}&otherId=${activeUser.id}`);
      const data = await res.json();
      const processed = data.map(m => ({ ...m, isMe: m.senderId === currentUser.id }));
      setMessages(processed);
      markRead();
    };
    fetchHistory();
  }, [activeUser.id, currentUser.id]);

  useEffect(() => {
    const handleMsg = (data) => {
       if(data.message.senderId === activeUser.id || data.message.recipientId === activeUser.id) {
          setMessages(prev => [...prev, { ...data.message, isMe: false }]);
          markRead(); 
       }
    };
    const handleSentConfirm = (data) => setMessages(prev => [...prev, data.finalMsg]);
    const handleReadUpdate = (data) => {
        if(data.by === activeUser.id) setMessages(prev => prev.map(m => m.isMe ? { ...m, status: 'read' } : m));
    };

    socket.on('receive_message', handleMsg);
    socket.on('message_sent_confirm', handleSentConfirm);
    socket.on('messages_were_read', handleReadUpdate);

    return () => {
        socket.off('receive_message', handleMsg);
        socket.off('message_sent_confirm', handleSentConfirm);
        socket.off('messages_were_read', handleReadUpdate);
    };
  }, [socket, activeUser.id]);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = (fileUrl = null, type = 'text') => {
    if(!input.trim() && !fileUrl) return;
    const msg = { 
      id: Date.now(), 
      text: type !== 'text' ? type : input, 
      fileUrl, 
      type, 
      senderId: currentUser.id 
    };
    socket.emit('send_message', { senderId: currentUser.id, recipientId: activeUser.id, message: msg });
    if(type === 'text') setInput("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if(data.url) sendMessage(data.url, type);
    } catch(err) { console.error(err); }
  };

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    const formData = new FormData();
    formData.append('file', file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if(data.url) sendMessage(data.url, type);
    } catch(err) { console.error(err); }
  };

  const getLastSeen = () => {
      if(activeUser.isOnline) return "Online";
      if(!activeUser.lastSeen) return "Offline";
      const date = new Date(activeUser.lastSeen);
      const isToday = date.getDate() === new Date().getDate();
      return `Last seen ${isToday ? 'today' : date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a]">
      {/* Header */}
      <div className="flex-none h-16 bg-white dark:bg-gray-800 px-4 flex items-center gap-3 shadow-sm z-10 border-b dark:border-gray-700">
        <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 p-1 rounded-full"><ArrowLeft /></button>
        <Avatar user={activeUser} />
        <div className="flex-1">
           <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{activeUser.name}</h3>
           <span className="text-xs text-green-500">{getLastSeen()}</span>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><MoreVertical /></button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border dark:border-gray-700 py-1 z-20">
              <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2" onClick={() => { setMessages([]); setMenuOpen(false); }}>
                <Trash2 size={16} /> Clear Local Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain" 
           style={{ backgroundImage: currentUser.settings?.wallpaper ? `url(${currentUser.settings.wallpaper})` : "none", backgroundSize: 'cover', backgroundPosition: 'center' }}>
         
         {messages.map((m, i) => {
            const effectiveType = getFileType(m);

            return (
              <div key={i} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-2 py-2 rounded-lg text-sm shadow-sm 
                    ${m.isMe ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 dark:text-white'}`}>
                    
                    {/* IMAGE */}
                    {effectiveType === 'image' && (
                      <div className="relative overflow-hidden rounded-lg mb-1">
                        <img 
                            src={m.fileUrl} 
                            className="w-full h-auto min-w-[150px] max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition" 
                            onClick={() => setViewMedia({ url: m.fileUrl, type: 'image' })}
                            alt="attachment"
                        />
                      </div>
                    )}

                    {/* VIDEO */}
                    {effectiveType === 'video' && (
                      <div className="relative cursor-pointer group rounded-lg overflow-hidden bg-black min-w-[200px] max-w-[280px]" onClick={() => setViewMedia({ url: m.fileUrl, type: 'video' })}>
                          <video 
                            src={m.fileUrl} 
                            className="w-full max-h-[250px] object-contain" 
                            muted 
                            preload="metadata" 
                            playsInline 
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition">
                              <div className="bg-black/60 p-3 rounded-full backdrop-blur-sm"><Play fill="white" className="text-white ml-1" size={20}/></div>
                          </div>
                      </div>
                    )}

                    {/* TEXT */}
                    {effectiveType === 'text' && <p className="leading-relaxed px-1"><Linkify text={m.text} /></p>}
                    
                    {/* META */}
                    <div className={`flex justify-end items-center gap-1 mt-1 text-[10px] pr-1 ${m.isMe ? 'text-white/80' : 'text-gray-400'}`}>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {m.isMe && <span className="capitalize font-medium">• {m.status}</span>} 
                    </div>
                </div>
              </div>
            );
         })}
      </div>

      {/* Footer - WITH LIFTED BOTTOM FOR IPHONE 15 */}
      {/* Added 'pb-8' to lift the bar above the corner radius */}
      <div className="flex-none bg-white dark:bg-gray-800 p-2 pb-8 flex items-center gap-2 border-t dark:border-gray-700 safe-area-bottom">
         <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" />
         <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><Paperclip size={20}/></button>
         <button onClick={() => setShowCamera(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><Camera size={20}/></button>
         <input 
           className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 outline-none dark:text-white placeholder-gray-500" 
           value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} onFocus={markRead} placeholder="Message"
         />
         <button onClick={() => sendMessage()} className="p-2 bg-primary rounded-full text-white shadow-lg hover:brightness-110 transition active:scale-95"><Send size={18} /></button>
      </div>

      {viewMedia && <MediaViewer media={viewMedia} onClose={() => setViewMedia(null)} />}
      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={handleCameraCapture} />}
    </div>
  );
};

export default ChatView;
