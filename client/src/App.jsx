import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import Avatar from './components/Avatar';
import { Settings as SettingsIcon, Search } from 'lucide-react';

const socket = io();

function App() {
  const [user, setUser] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState([]); 
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // --- IOS KEYBOARD FIX (Visual Viewport Engine) ---
  const [viewportHeight, setViewportHeight] = useState('100%');

  useEffect(() => {
    // This function forces the app height to match the visible area
    // (excluding the keyboard)
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
        // Scroll to bottom of chat if open (optional polish)
        window.scrollTo(0, 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      handleResize(); // Init
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // --- THEME ENGINE ---
  useLayoutEffect(() => {
     if (user?.settings) {
       if(user.settings.darkMode) document.documentElement.classList.add('dark');
       else document.documentElement.classList.remove('dark');
       
       const themeColor = user.settings.theme || '#2563eb';
       document.documentElement.style.setProperty('--primary-color', themeColor);
     }
  }, [user]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedUserStr = localStorage.getItem('stalk_user');
    if (savedUserStr) {
      const savedUser = JSON.parse(savedUserStr);
      setUser(savedUser); 
      // Force Fresh Sync
      fetch(`/api/me?id=${savedUser.id}&t=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
           if(data.success) {
             setUser(data.user); 
             localStorage.setItem('stalk_user', JSON.stringify(data.user));
           }
        }).catch(err => console.error(err));
    }
  }, []);

  // --- FETCH USERS ---
  const fetchUsers = useCallback(() => {
    if(!user) return;
    const url = `/api/users/search?q=${searchQuery}&currentUserId=${user.id}&t=${Date.now()}`;
    fetch(url).then(r => r.json()).then(setUsersList);
  }, [user, searchQuery]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000); 
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // --- SOCKETS ---
  useEffect(() => {
    if(!user) return;
    socket.emit('join', user.id);

    const handleStatusUpdate = ({ userId, isOnline, lastSeen }) => {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isOnline, lastSeen } : u));
        if(activeUser?.id === userId) setActiveUser(prev => ({ ...prev, isOnline, lastSeen }));
    };

    const handleNewMsg = (data) => {
        const senderId = data.message.senderId;
        if(selectedChatId !== senderId) {
            setUsersList(prev => prev.map(u => u.id === senderId ? { ...u, unread: (u.unread || 0) + 1 } : u));
        }
    };

    const handleUserUpdated = ({ userId, user: updatedUser }) => {
        if(user.id === userId) {
            setUser(updatedUser);
            localStorage.setItem('stalk_user', JSON.stringify(updatedUser));
        }
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
        if(activeUser?.id === userId) setActiveUser(prev => ({ ...prev, ...updatedUser }));
    };

    socket.on('status_update', handleStatusUpdate);
    socket.on('receive_message', handleNewMsg);
    socket.on('user_updated', handleUserUpdated);

    return () => {
        socket.off('status_update', handleStatusUpdate);
        socket.off('receive_message', handleNewMsg);
        socket.off('user_updated', handleUserUpdated);
    };
  }, [user, selectedChatId, activeUser]);

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });
    const data = await res.json();
    if(data.success) {
      setUser(data.user);
      localStorage.setItem('stalk_user', JSON.stringify(data.user));
    } else alert(data.message);
  };

  const handleLogout = () => {
    localStorage.removeItem('stalk_user');
    window.location.reload();
  };

  const handleUpdateUser = (updates) => {
      const updatedUser = {...user, ...updates, settings: {...user.settings, ...updates.settings}};
      setUser(updatedUser);
      localStorage.setItem('stalk_user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
         <div className="flex flex-col items-center gap-4 w-96 px-4">
            <img src="/logo.svg" className="w-24 h-24" alt="Logo" /> 
            <div className="p-8 bg-gray-800 rounded-lg shadow-xl w-full">
              <h1 className="text-3xl font-bold text-center mb-6 text-blue-500">sTalk</h1>
              <input className="w-full mb-3 p-3 rounded bg-gray-700 outline-none" placeholder="Username" value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} />
              <input className="w-full mb-6 p-3 rounded bg-gray-700 outline-none" type="password" placeholder="Password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()}/>
              <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded font-bold">Login</button>
            </div>
         </div>
      </div>
    );
  }

  return (
    // FIX: Apply the dynamic viewportHeight directly to the container
    <div 
      className="fixed inset-0 flex overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200"
      style={{ height: viewportHeight }} 
    >
      <div className={`w-full md:w-[380px] flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-16 px-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
             <img src="/logo.svg" className="w-8 h-8" alt="Logo" />
             <h1 className="text-2xl font-bold text-primary font-sans">sTalk</h1>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"><SettingsIcon className="text-gray-600 dark:text-gray-300" /></button>
        </div>

        <div className="p-3">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <Search size={18} className="text-gray-500"/>
                <input className="bg-transparent ml-2 outline-none text-sm dark:text-white w-full placeholder-gray-500" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
             {usersList.map(u => (
                 <div key={u.id} onClick={() => { setSelectedChatId(u.id); setActiveUser(u); setUsersList(prev => prev.map(pu => pu.id === u.id ? { ...pu, unread: 0 } : pu)); }} 
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${selectedChatId === u.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                    <Avatar user={u} />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                             <p className={`truncate text-sm ${u.unread > 0 ? 'font-black dark:text-white' : 'font-medium dark:text-gray-200'}`}>{u.name || u.username}</p>
                             {u.unread > 0 && <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{u.unread}</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{u.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                 </div>
             ))}
        </div>
      </div>

      <div className={`flex-1 relative ${!selectedChatId ? 'hidden md:flex' : 'flex flex-col'}`}>
        {selectedChatId ? <ChatView activeUser={activeUser} currentUser={user} socket={socket} onBack={() => setSelectedChatId(null)} /> : (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4 bg-gray-50 dark:bg-gray-900">
              <img src="/logo.svg" className="w-32 h-32 opacity-10 grayscale" />
              <p className="text-lg font-medium">Select a user to start chatting</p>
           </div>
        )}
      </div>

      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />}
    </div>
  );
}

export default App;
