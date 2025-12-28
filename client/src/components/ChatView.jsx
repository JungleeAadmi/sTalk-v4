import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Trash2, Camera, Mic, X, Edit2, Reply } from 'lucide-react';
import Avatar from './Avatar';
import MediaViewer from './MediaViewer';
import CameraModal from './CameraModal';
import VoiceRecorder from './VoiceRecorder';

const Linkify = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline hover:text-blue-300 break-all relative z-10"
      >
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
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

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

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 1000);
    }
  };

  const markRead = () =>
    socket.emit('mark_read', { userId: currentUser.id, otherId: activeUser.id });

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
      if (
        data.message.senderId === activeUser.id ||
        data.message.recipientId === activeUser.id
      ) {
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
      if (from === activeUser.id) setOtherTyping(isTyping);
    };

    socket.on('receive_message', handleMsg);
    socket.on('message_sent_confirm', d => setMessages(p => [...p, d.finalMsg]));
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  const handleTypingInput = (e) => {
    setInput(e.target.value);
    if (!isTyping) {
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
    if ((!input.trim() && !fileUrl)) return;

    if (editingId) {
      socket.emit('edit_message', { messageId: editingId, newText: input });
      setEditingId(null);
      setInput("");
      return;
    }

    const msg = {
      id: Date.now(),
      text: type !== 'text' ? type : input,
      fileUrl,
      type,
      senderId: currentUser.id,
      replyTo: replyingTo
    };

    socket.emit('send_message', {
      senderId: currentUser.id,
      recipientId: activeUser.id,
      message: msg
    });

    if (type === 'text') setInput("");
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">

      {/* ✅ FIXED HEADER – SAFE FOR iOS */}
      <div
        className="flex-none h-16 bg-white dark:bg-gray-800 px-4 flex items-center gap-3
                   shadow-sm z-10 border-b dark:border-gray-700 sticky top-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300">
          <ArrowLeft />
        </button>

        <div onClick={() => setViewMedia({ url: activeUser.avatar, type: 'image' })} className="cursor-pointer">
          <Avatar user={activeUser} />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">
            {activeUser.name}
          </h3>
          <span className="text-xs text-primary">
            {otherTyping ? "typing..." : (activeUser.isOnline ? "Online" : "Offline")}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <MoreVertical />
          </button>

          {headerMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border dark:border-gray-700 py-1 z-20">
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => {
                  if (confirm("Clear all messages in this view?")) {
                    setMessages([]);
                    setHeaderMenuOpen(false);
                  }
                }}
              >
                <Trash2 size={16} /> Clear Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHAT + INPUT remain unchanged */}
      {/* … rest of your file continues exactly as before … */}

    </div>
  );
};

export default ChatView;
