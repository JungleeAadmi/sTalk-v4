import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Trash2, Play, Camera, Mic, X, Edit2, Reply } from 'lucide-react';
import Avatar from './Avatar';
import MediaViewer from './MediaViewer';
import CameraModal from './CameraModal';
import VoiceRecorder from './VoiceRecorder';

const Linkify = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => 
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all relative z-10">
        {part}
      </a>
    ) : part
  );
};

const REACTIONS = ['❤️', '😂', '😍', '😘', '🤗', '☺️', '😉', '🤤', '😭', '👌', '🥰'];

const ChatView = ({ activeUser, currentUser, socket, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [menuOpenId, setMenuOpenId] = useState(null); 
  const [viewMedia, setViewMedia] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getFileType = (msg) => {
    if (msg.type === 'video') return 'video';
    if (msg.type === 'image') return 'image';
    if (msg.type === 'audio') return 'audio';
    const ext = msg.fileUrl?.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['jpg', 'png', 'jpeg'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'ogg', 'webm'].includes(ext)) return 'audio';
    return 'text';
  };

  // --- SOCKETS & SYNC ---
  const markRead = () => socket.emit('mark_read', { userId: currentUser.id, otherId: activeUser.id });

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`/api/chat/history?userId=${currentUser.id}&otherId=${activeUser.id}`);
      const data = await res.json();
      setMessages(data.map(m => ({ ...m, isMe: m.senderId === currentUser.id })));
      markRead();
    };
    fetchHistory();
  }, [activeUser.id]);

  useEffect(() => {
    const handleMsg = (data) => {
       if(data.message.senderId === activeUser.id || data.message.recipientId === activeUser.id) {
          setMessages(prev => [...prev, { ...data.message, isMe: false }]);
          markRead();
       }
    };
    const handleUpdate = (msg) => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...msg, isMe: m.isMe } : m));
    };
    const handleDelete = ({ messageId }) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
    };
    const handleTyping = ({ from, isTyping }) => {
        if(from === activeUser.id) setOtherTyping(isTyping);
    };

    socket.on('receive_message', handleMsg);
    socket.on('message_sent_confirm', (data) => setMessages(prev => [...prev, data.finalMsg]));
    socket.on('message_updated', handleUpdate);
    socket.on('message_deleted', handleDelete);
    socket.on('typing_status', handleTyping);
    
    return () => {
        socket.off('receive_message');
        socket.off('message_sent_confirm');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('typing_status');
    };
  }, [socket, activeUser.id]);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, otherTyping]);

  const handleTypingInput = (e) => {
      setInput(e.target.value);
      if(!isTyping) {
          setIsTyping(true);
          socket.emit('typing', { to: activeUser.id, isTyping: true });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          socket.emit('typing', { to: activeUser.id, isTyping: false });
      }, 2000);
  };

  const sendMessage = (fileUrl = null, type = 'text') => {
    if((!input.trim() && !fileUrl)) return;
    
    if(editingId) {
        socket.emit('edit_message', { messageId: editingId, newText: input });
        setEditingId(null);
        setInput("");
        return;
    }

    const msg = { 
      id: Date.now(),
      text: type !== 'text' ? type : input, 
      fileUrl, type, 
      senderId: currentUser.id,
      replyTo: replyingTo 
    };
    
    socket.emit('send_message', { senderId: currentUser.id, recipientId: activeUser.id, message: msg });
    
    if(type === 'text') setInput("");
    setReplyingTo(null);
  };

  // Standard File Upload
  const handleFileUpload = async (e) => {
    const file = (e.target && e.target.files) ? e.target.files[0] : e;
    if(!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    let type = 'text';
    if(file.type.startsWith('image')) type = 'image';
    else if(file.type.startsWith('video')) type = 'video';
    else if(file.type.startsWith('audio')) type = 'audio';

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if(data.url) {
          sendMessage(data.url, type);
          setIsRecording(false);
      }
    } catch(err) { console.error(err); }
  };

  // Dedicated Camera Capture (Closes Modal)
  const handleCameraCapture = async (file) => {
      await handleFileUpload(file);
      setShowCamera(false); // Close the modal after upload
  };

  const handleReaction = (msgId, emoji) => {
      socket.emit('add_reaction', { chatId: null, messageId: msgId, emoji, userId: currentUser.id });
      setMenuOpenId(null);
  };

  const handleDelete = (msgId) => {
      if(confirm("Delete this message?")) socket.emit('delete_message', { messageId: msgId });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-none h-16 bg-white dark:bg-gray-800 px-4 flex items-center gap-3 shadow-sm z-10 border-b dark:border-gray-700 transition-colors">
        <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300"><ArrowLeft /></button>
        <div onClick={() => setViewMedia({ url: activeUser.avatar, type: 'image' })} className="cursor-pointer">
            <Avatar user={activeUser} />
        </div>
        <div className="flex-1">
           <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{activeUser.name}</h3>
           <span className="text-xs text-primary animate-pulse">
               {otherTyping ? "typing..." : (activeUser.isOnline ? "Online" : "Offline")}
           </span>
        </div>
        <MoreVertical className="text-gray-400" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain" 
           style={{ backgroundImage: currentUser.settings?.wallpaper ? `url(${currentUser.settings.wallpaper})` : "none", backgroundSize: 'cover', backgroundPosition: 'center' }}>
         
         {messages.map((m, i) => {
            const type = getFileType(m);
            const hasReactions = m.reactions && Object.keys(m.reactions).length > 0;

            return (
              <div key={i} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'} relative group`}>
                {m.replyTo && (
                    <div className={`text-xs mb-1 px-2 py-1 rounded opacity-70 ${m.isMe ? 'bg-primary/20 text-right' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        Replying to: {m.replyTo.text?.substring(0, 20)}...
                    </div>
                )}

                <div 
                    onDoubleClick={() => setMenuOpenId(m.id)}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`max-w-[75%] px-2 py-2 rounded-lg text-sm shadow-sm relative select-none touch-action-manipulation
                    ${m.isMe ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 dark:text-white'}`}
                >
                    {/* Double Click on Media opens Menu, Click opens Viewer */}
                    {type === 'image' && <img src={m.fileUrl} className="max-w-[250px] rounded mb-1 cursor-pointer" onClick={() => setViewMedia({url:m.fileUrl, type:'image'})} onDoubleClick={(e) => {e.stopPropagation(); setMenuOpenId(m.id)}} />}
                    {type === 'video' && <video src={m.fileUrl} className="max-w-[250px] rounded mb-1" controls playsInline muted onDoubleClick={(e) => {e.stopPropagation(); setMenuOpenId(m.id)}} />}
                    {type === 'audio' && <audio src={m.fileUrl} controls className="w-[250px] h-10 mt-1" onDoubleClick={(e) => {e.stopPropagation(); setMenuOpenId(m.id)}} />}
                    
                    {type === 'text' && <p className="leading-relaxed px-1"><Linkify text={m.text} /></p>}
                    
                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] opacity-70">
                      {m.isEdited && <span>(edited)</span>}
                      <span>{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      {m.isMe && <span>• {m.status}</span>}
                    </div>

                    {hasReactions && (
                        <div className="absolute -bottom-2 right-0 bg-white dark:bg-gray-700 rounded-full px-1 shadow-md border dark:border-gray-600 flex gap-0.5 text-xs z-10 scale-90">
                            {Object.values(m.reactions).slice(0, 3).map((r, idx) => <span key={idx}>{r}</span>)}
                            {Object.values(m.reactions).length > 3 && <span>+</span>}
                        </div>
                    )}
                </div>

                {menuOpenId === m.id && (
                    <div className={`absolute bottom-full mb-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-2 flex flex-col gap-2 min-w-[200px] animate-fade-in ${m.isMe ? 'right-0' : 'left-0'}`}>
                        <div className="flex flex-wrap gap-1 mb-2 border-b dark:border-gray-600 pb-2">
                            {REACTIONS.map(r => (
                                <button key={r} onClick={() => handleReaction(m.id, r)} className="hover:scale-125 transition text-lg p-1">{r}</button>
                            ))}
                        </div>
                        <button onClick={() => { setReplyingTo(m); setMenuOpenId(null); }} className="flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"><Reply size={14}/> Reply</button>
                        {m.isMe && (
                            <>
                                {type === 'text' && <button onClick={() => { setEditingId(m.id); setInput(m.text); setMenuOpenId(null); }} className="flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"><Edit2 size={14}/> Edit</button>}
                                <button onClick={() => handleDelete(m.id)} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/> Delete</button>
                            </>
                        )}
                        <button onClick={() => setMenuOpenId(null)} className="text-xs text-center text-gray-400 mt-1 w-full border-t pt-1">Close</button>
                    </div>
                )}
              </div>
            );
         })}
      </div>

      <div className="flex-none bg-white dark:bg-gray-800 p-2 pb-8 flex items-center gap-2 border-t dark:border-gray-700 safe-area-bottom relative transition-colors">
         {replyingTo && (
             <div className="absolute bottom-full left-0 w-full bg-gray-100 dark:bg-gray-700 p-2 border-t dark:border-gray-600 flex justify-between items-center text-xs">
                 <span className="truncate border-l-4 border-primary pl-2">Replying to: {replyingTo.text || "Media"}</span>
                 <button onClick={() => setReplyingTo(null)}><X size={14}/></button>
             </div>
         )}

         {isRecording ? (
             <VoiceRecorder onSend={handleFileUpload} onCancel={() => setIsRecording(false)} />
         ) : (
             <>
                <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*,audio/*" />
                <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Paperclip size={20}/></button>
                <button onClick={() => setShowCamera(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Camera size={20}/></button>
                
                <input 
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 outline-none dark:text-white placeholder-gray-500" 
                  value={input} 
                  onChange={handleTypingInput} 
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                  placeholder={editingId ? "Edit message..." : "Message"}
                />
                
                {input.trim() ? (
                    <button onClick={() => sendMessage()} className="p-2 bg-primary rounded-full text-white shadow"><Send size={18} /></button>
                ) : (
                    <button onClick={() => setIsRecording(true)} className="p-2 bg-primary rounded-full text-white shadow"><Mic size={18} /></button>
                )}
             </>
         )}
      </div>

      {viewMedia && <MediaViewer media={viewMedia} onClose={() => setViewMedia(null)} />}
      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={handleCameraCapture} />}
    </div>
  );
};

export default ChatView;