import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = (settings) => {
    if (!settings) return;
    // Apply Dark Mode
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    // Apply Color
    const color = settings.theme || '#2563eb';
    document.documentElement.style.setProperty('--primary-color', color);
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. Try Local Storage (Fast Load)
      const localData = localStorage.getItem('stalk_user');
      let initialUser = localData ? JSON.parse(localData) : null;

      if (initialUser) {
        setUser(initialUser);
        applyTheme(initialUser.settings); // Apply immediately
        
        // 2. Force Server Sync (The Truth)
        try {
            const res = await fetch(`/api/me?id=${initialUser.id}&t=${Date.now()}`); // timestamp bypasses cache
            const data = await res.json();
            if (data.success) {
                console.log("Server Sync Success:", data.user.settings);
                // OVERWRITE local with Server Truth
                initialUser = data.user; 
                setUser(initialUser);
                applyTheme(initialUser.settings);
                localStorage.setItem('stalk_user', JSON.stringify(initialUser));
            }
        } catch (err) {
            console.error("Sync failed, using local data", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const updateUser = (newData) => {
    setUser(prev => {
        const merged = { ...prev, ...newData, settings: { ...prev?.settings, ...newData.settings } };
        applyTheme(merged.settings);
        localStorage.setItem('stalk_user', JSON.stringify(merged));
        return merged;
    });
  };

  const logout = () => {
    localStorage.removeItem('stalk_user');
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
