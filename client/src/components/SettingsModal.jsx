import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, Shield, LogOut, Plus, Trash2, Key, Moon, Sun, Bell } from 'lucide-react';
import ProfileUploader from './ProfileUploader';
import { subscribeUser } from '../utils/pushManager';

const SettingsModal = ({ user, onClose, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [editName, setEditName] = useState(user.name || user.username);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Admin State
  const [adminUsers, setAdminUsers] = useState([]);
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetPassId, setResetPassId] = useState(null);
  const [resetPassVal, setResetPassVal] = useState('');

  useEffect(() => {
    if(user.role === 'admin' && activeTab === 'admin') {
        fetch('/api/admin/users').then(r => r.json()).then(setAdminUsers);
    }
  }, [activeTab, user.role]);

  // --- API HELPER ---
  const saveSetting = async (updates) => {
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id, updates })
      });
      const data = await res.json();
      if(data.success) onUpdateUser(data.user);
    } catch(e) { console.error("Failed to save", e); }
  };

  // --- HANDLERS ---
  const handleUpdateName = () => {
      saveSetting({ name: editName });
      alert("Display name updated!");
  };

  const handleEnableNotifications = async () => {
    try {
      const result = await subscribeUser(user.id);
      if(result) alert("Notifications Enabled! You will receive messages when offline.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleTestPush = async () => {
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id })
      });
      
      const text = await res.text(); 
      try {
          const data = JSON.parse(text);
          if(data.success) alert("Sent! Close this app immediately to see the notification.");
          else alert("Server Error: " + data.error);
      } catch(e) {
          alert("Network/Server Error: " + text.substring(0, 100));
      }
    } catch (e) { 
        alert("Client Error: " + e.message); 
    }
  };

  const handleChangePassword = async () => {
    const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id, oldPassword: oldPass, newPassword: newPass })
    });
    const data = await res.json();
    if(data.success) { alert("Password Changed"); setOldPass(''); setNewPass(''); } 
    else alert(data.error);
  };

  // --- ADMIN HANDLERS ---
  const handleCreateUser = async () => {
    if(!newUserUser || !newUserPass) return alert("Username and Password required");
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username: newUserUser, name: newUserName, password: newUserPass })
    });
    const data = await res.json();
    if(data.success) {
      alert("User created!");
      setAdminUsers([...adminUsers, data.user]);
      setNewUserUser(''); setNewUserName(''); setNewUserPass('');
    } else alert(data.error);
  };

  const handleDeleteUser = async (id) => {
    if(!confirm("Delete this user?")) return;
    const res = await fetch('/api/admin/delete-user', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ targetUserId: id })
    });
    if(res.ok) setAdminUsers(adminUsers.filter(u => u.id !== id));
  };

  const handleResetPassword = async () => {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ targetUserId: resetPassId, newPassword: resetPassVal })
    });
    const data = await res.json();
    if(data.success) { alert("Password reset."); setResetPassId(null); setResetPassVal(''); }
  };

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if(data.url) saveSetting({ settings: { wallpaper: data.url } });
  };

  const themes = [
    { name: 'Grey', color: '#6b7280' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Blue', color: '#3b82f6' }, 
    { name: 'Purple', color: '#a855f7' },
    { name: 'Light Pink', color: '#f9a8d4' },
    { name: 'Mid Pink', color: '#ec4899' },
    { name: 'Dark Pink', color: '#be185d' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl flex h-[600px] overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col gap-2 border-r dark:border-gray-700">
          <h2 className="text-xl font-bold text-primary mb-4">Settings</h2>
          <button onClick={()=>setActiveTab('profile')} className={`p-3 rounded flex gap-2 text-sm font-bold ${activeTab==='profile'?'bg-white shadow text-primary':'text-gray-600 dark:text-gray-400'}`}><User size={18}/> Profile</button>
          <button onClick={()=>setActiveTab('appearance')} className={`p-3 rounded flex gap-2 text-sm font-bold ${activeTab==='appearance'?'bg-white shadow text-primary':'text-gray-600 dark:text-gray-400'}`}><ImageIcon size={18}/> Appearance</button>
          {user.role === 'admin' && (
            <button onClick={()=>setActiveTab('admin')} className={`p-3 rounded flex gap-2 text-sm font-bold ${activeTab==='admin'?'bg-white shadow text-primary':'text-gray-600 dark:text-gray-400'}`}><Shield size={18}/> Admin</button>
          )}
          <button onClick={onLogout} className="mt-auto p-3 text-red-500 flex gap-2 text-sm font-bold"><LogOut size={18}/> Logout</button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-white dark:bg-gray-900">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X/></button>

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold dark:text-white">Your Profile</h3>
               <ProfileUploader 
                 currentImage={user.avatar} 
                 onUpload={(url) => saveSetting({ avatar: url })} 
               />
               
               {/* UPDATED: Name Editor Layout Fix */}
               <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                 <label className="text-xs text-gray-500 uppercase font-bold">Display Name</label>
                 <div className="flex flex-col gap-2 mt-2">
                    <input 
                        className="w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded px-3 py-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                    />
                    <button onClick={handleUpdateName} className="self-start text-xs bg-primary text-white px-4 py-2 rounded font-bold shadow hover:opacity-90">
                        Save Name
                    </button>
                 </div>
                 <p className="text-xs text-gray-400 mt-2">Username: <span className="font-mono">{user.username}</span></p>
               </div>

               {/* Notification Section */}
               <div className="border-t dark:border-gray-700 pt-6">
                  <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Bell size={16}/> Notifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleEnableNotifications} className="py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-primary font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition">Enable Push</button>
                    <button onClick={handleTestPush} className="py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Send Test</button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">iOS needs 'Add to Home Screen'.</p>
               </div>

               {/* Password */}
               <div className="border-t dark:border-gray-700 pt-6">
                 <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Key size={16}/> Change Password</h4>
                 <input type="password" placeholder="Current Password" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="block w-full mb-2 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"/>
                 <input type="password" placeholder="New Password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="block w-full mb-2 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"/>
                 <button onClick={handleChangePassword} className="bg-primary text-white px-4 py-2 rounded text-sm w-full">Update Password</button>
               </div>
            </div>
          )}

          {/* --- APPEARANCE TAB --- */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
               <div>
                 <h3 className="text-lg font-bold dark:text-white mb-4">Theme Color</h3>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                   {themes.map(t => (
                     <button 
                       key={t.color}
                       onClick={() => saveSetting({ settings: { theme: t.color } })}
                       className={`p-2 rounded border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${user.settings?.theme === t.color ? 'border-primary bg-gray-50 dark:bg-gray-800 ring-2 ring-primary/20' : 'border-transparent'}`}
                     >
                       <div className="w-8 h-8 rounded-full shadow-sm border border-black/10" style={{background: t.color}}></div>
                       <span className="text-[10px] font-medium dark:text-white text-center leading-tight">{t.name}</span>
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                  <h3 className="text-lg font-bold dark:text-white mb-4">Display Mode</h3>
                  <button 
                    onClick={() => saveSetting({ settings: { darkMode: !user.settings?.darkMode } })}
                    className="flex items-center justify-between w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="flex items-center gap-2 dark:text-white font-bold">
                      {user.settings?.darkMode ? <Moon size={20}/> : <Sun size={20}/>} 
                      {user.settings?.darkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${user.settings?.darkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.settings?.darkMode ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </button>
               </div>

               <div>
                 <h3 className="text-lg font-bold dark:text-white mb-2">Chat Wallpaper</h3>
                 <input type="file" onChange={handleWallpaperUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                 {user.settings?.wallpaper && (
                   <div className="mt-4 relative w-full h-32 group">
                     <img src={user.settings.wallpaper} className="w-full h-full object-cover rounded-lg shadow-md"/>
                     <button onClick={() => saveSetting({ settings: { wallpaper: null } })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition"><X size={16}/></button>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* --- ADMIN TAB --- */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h3 className="font-bold mb-3 dark:text-white flex items-center gap-2"><Plus size={18}/> Create New User</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Username" value={newUserUser} onChange={e=>setNewUserUser(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                  <input placeholder="Display Name" value={newUserName} onChange={e=>setNewUserName(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                  <input placeholder="Password" value={newUserPass} onChange={e=>setNewUserPass(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                </div>
                <button onClick={handleCreateUser} className="bg-primary text-white px-4 py-2 rounded text-sm mt-3 w-full shadow hover:opacity-90">Create User</button>
              </div>

              <div>
                <h3 className="font-bold mb-3 dark:text-white">All Users</h3>
                <div className="overflow-hidden rounded-lg border dark:border-gray-700 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(u => (
                        <tr key={u.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                             {u.avatar ? <img src={u.avatar} className="w-6 h-6 rounded-full object-cover"/> : <div className="w-6 h-6 rounded-full bg-gray-300"></div>}
                             {u.name}
                          </td>
                          <td className="px-4 py-3">{u.username}</td>
                          <td className="px-4 py-3 text-right flex justify-end gap-2">
                            <button onClick={()=>setResetPassId(u.id)} className="text-blue-500 hover:text-blue-700 p-1" title="Reset Password"><Key size={16}/></button>
                            <button onClick={()=>handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {resetPassId && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 flex gap-2 items-center animate-fade-in">
                    <span className="text-xs font-bold dark:text-white">Resetting Password:</span>
                    <input className="border p-1 rounded text-sm flex-1 dark:bg-gray-900 dark:text-white outline-none" placeholder="New Password" value={resetPassVal} onChange={e=>setResetPassVal(e.target.value)} />
                    <button onClick={handleResetPassword} className="bg-blue-600 text-white px-3 py-1 rounded text-sm shadow">Save</button>
                    <button onClick={()=>{setResetPassId(null); setResetPassVal('')}} className="text-gray-500 text-sm hover:underline">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
