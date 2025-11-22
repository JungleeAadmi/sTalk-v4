import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, Shield, LogOut, Plus, Trash2, Key, Moon, Sun } from 'lucide-react';
import ProfileUploader from './ProfileUploader';

const SettingsModal = ({ user, onClose, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Change Password State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Admin State
  const [adminUsers, setAdminUsers] = useState([]);
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  
  // Admin Reset Password State
  const [resetPassId, setResetPassId] = useState(null);
  const [resetPassVal, setResetPassVal] = useState('');

  // Fetch Users if Admin
  useEffect(() => {
    if(user.role === 'admin' && activeTab === 'admin') {
        fetch('/api/admin/users').then(r => r.json()).then(setAdminUsers);
    }
  }, [activeTab, user.role]);

  // --- API HELPER FOR UPDATES ---
  // This ensures we hit the server first, then update local state
  const saveSetting = async (updates) => {
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id, updates })
      });
      const data = await res.json();
      if(data.success) {
        // Only update local if server confirmed
        onUpdateUser(data.user);
      }
    } catch(e) {
      console.error("Failed to save setting", e);
    }
  };

  // --- ACTIONS ---

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
    { name: 'Electric Blue', color: '#2563eb' },
    { name: 'Neon Purple', color: '#7c3aed' },
    { name: 'Teal Cyan', color: '#06b6d4' },
    { name: 'Lime Green', color: '#84cc16' }
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
            <button onClick={()=>setActiveTab('admin')} className={`p-3 rounded flex gap-2 text-sm font-bold ${activeTab==='admin'?'bg-white shadow text-primary':'text-gray-600 dark:text-gray-400'}`}><Shield size={18}/> User Management</button>
          )}
          <button onClick={onLogout} className="mt-auto p-3 text-red-500 flex gap-2 text-sm font-bold"><LogOut size={18}/> Logout</button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-white dark:bg-gray-900">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X/></button>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold dark:text-white">Your Profile</h3>
               <ProfileUploader 
                 currentImage={user.avatar} 
                 onUpload={(url) => saveSetting({ avatar: url })} 
               />
               <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                 <label className="text-xs text-gray-500 uppercase">Display Name</label>
                 <p className="font-bold text-lg dark:text-white">{user.name || user.username}</p>
               </div>

               <div className="border-t dark:border-gray-700 pt-6">
                 <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Key size={16}/> Change Password</h4>
                 <input type="password" placeholder="Current Password" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="block w-full mb-2 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"/>
                 <input type="password" placeholder="New Password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="block w-full mb-2 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"/>
                 <button onClick={handleChangePassword} className="bg-primary text-white px-4 py-2 rounded text-sm">Update Password</button>
               </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
               <div>
                 <h3 className="text-lg font-bold dark:text-white mb-4">Theme Color</h3>
                 <div className="grid grid-cols-2 gap-3">
                   {themes.map(t => (
                     <button 
                       key={t.color}
                       onClick={() => saveSetting({ settings: { theme: t.color } })}
                       className={`p-3 rounded border-2 flex items-center gap-2 ${user.settings?.theme === t.color ? 'border-primary' : 'border-transparent bg-gray-100 dark:bg-gray-800'}`}
                     >
                       <div className="w-6 h-6 rounded-full shadow-sm" style={{background: t.color}}></div>
                       <span className="text-sm font-medium dark:text-white">{t.name}</span>
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                  <h3 className="text-lg font-bold dark:text-white mb-4">Display Mode</h3>
                  <button 
                    onClick={() => saveSetting({ settings: { darkMode: !user.settings?.darkMode } })}
                    className="flex items-center justify-between w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="flex items-center gap-2 dark:text-white">
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
                 <input type="file" onChange={handleWallpaperUpload} className="block w-full text-sm text-gray-500"/>
                 {user.settings?.wallpaper && (
                   <div className="mt-2 relative w-32">
                     <img src={user.settings.wallpaper} className="h-20 w-full object-cover rounded"/>
                     <button onClick={() => saveSetting({ settings: { wallpaper: null } })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h3 className="font-bold mb-3 dark:text-white flex items-center gap-2"><Plus size={18}/> Create New User</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Username" value={newUserUser} onChange={e=>setNewUserUser(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                  <input placeholder="Display Name" value={newUserName} onChange={e=>setNewUserName(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                  <input placeholder="Password" value={newUserPass} onChange={e=>setNewUserPass(e.target.value)} className="border p-2 rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-600"/>
                </div>
                <button onClick={handleCreateUser} className="bg-primary text-white px-4 py-2 rounded text-sm mt-3 w-full">Create User</button>
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
                            <button onClick={()=>setResetPassId(u.id)} className="text-blue-500 hover:text-blue-700" title="Reset Password"><Key size={16}/></button>
                            <button onClick={()=>handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {resetPassId && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 flex gap-2 items-center">
                    <span className="text-xs font-bold dark:text-white">Resetting Password for selected user:</span>
                    <input className="border p-1 rounded text-sm flex-1 dark:bg-gray-900 dark:text-white" placeholder="New Password" value={resetPassVal} onChange={e=>setResetPassVal(e.target.value)} />
                    <button onClick={handleResetPassword} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Save</button>
                    <button onClick={()=>{setResetPassId(null); setResetPassVal('')}} className="text-gray-500 text-sm">Cancel</button>
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
