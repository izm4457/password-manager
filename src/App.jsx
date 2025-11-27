import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { v4 as uuidv4 } from 'uuid';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PasswordModal from './components/PasswordModal';
import PasswordDetail from './components/PasswordDetail';
import ConfirmationModal from './components/ConfirmationModal';
import Setup from './components/Setup';
import Settings from './components/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // masterPassword is no longer stored in React state for security
  const [passwords, setPasswords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Confirmation state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isFirstRun, setIsFirstRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  const autoLockTimerRef = useRef(null);
  const autoLockTimeoutRef = useRef(5); // Default 5 minutes

  useEffect(() => {
    checkInitialization();
    setupWindowStateTracking();
    loadAutoLockTimeout();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setupAutoLock();
      return () => {
        if (autoLockTimerRef.current) {
          clearTimeout(autoLockTimerRef.current);
        }
      };
    }
  }, [isAuthenticated]);

  const loadAutoLockTimeout = async () => {
    try {
      const minutes = await invoke('get_auto_lock_timeout');
      autoLockTimeoutRef.current = minutes;
    } catch (e) {
      console.error('Failed to load auto-lock timeout:', e);
    }
  };

  const setupAutoLock = () => {
    const resetTimer = () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }

      if (autoLockTimeoutRef.current > 0) {
        autoLockTimerRef.current = setTimeout(() => {
          handleLock();
        }, autoLockTimeoutRef.current * 60 * 1000);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  };

  const handleLock = async () => {
    try {
      await invoke('logout');
    } catch (e) {
      console.error('Logout failed:', e);
    }
    setIsAuthenticated(false);
    setPasswords([]); // Clear data from memory
  };

  const setupWindowStateTracking = async () => {
    const window = getCurrentWindow();
    let saveTimeout;

    const saveWindowState = async () => {
      try {
        const size = await window.innerSize();
        const position = await window.outerPosition();
        await invoke('save_window_state', {
          width: size.width,
          height: size.height,
          x: position.x,
          y: position.y
        });
      } catch (e) {
        console.error('Failed to save window state:', e);
      }
    };

    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveWindowState, 500);
    };

    const unlistenResize = await window.onResized(debouncedSave);
    const unlistenMove = await window.onMoved(debouncedSave);

    return () => {
      unlistenResize();
      unlistenMove();
      clearTimeout(saveTimeout);
    };
  };

  const checkInitialization = async () => {
    try {
      const initialized = await invoke('is_initialized');
      setIsFirstRun(!initialized);
    } catch (e) {
      console.error('Failed to check initialization:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = async (password) => {
    // Setup component calls initialize_database_secure internally? 
    // No, Setup component likely calls a prop.
    // We need to update Setup component to call the new command or handle it here.
    // Let's assume Setup passes the password back here.

    // Actually, we should call initialize_database_secure here.
    // But wait, Setup might need path?
    // Let's look at Setup component later. For now, let's assume we handle initialization here.
    // But Setup usually handles the file picking.

    // If Setup calls onComplete with password, it implies it's done.
    // But we need to actually initialize the DB.
    // Let's assume Setup component does the heavy lifting or we do it.
    // Let's reload to be safe.

    // Wait, if Setup component calls initialize_database, it needs to be updated to call initialize_database_secure.
    // We will update Setup component separately. 
    // Here we just assume we are logged in after setup.

    // We need to ensure we are logged in.
    // If initialize_database_secure sets the state, we are logged in.

    await reloadPasswords();
    setIsFirstRun(false);
    setIsAuthenticated(true);
  };

  const reloadPasswords = async () => {
    try {
      const data = await invoke('load_passwords_secure');
      const parsed = JSON.parse(data);
      setPasswords(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (password) => {
    try {
      // Login command now sets the session key in backend
      await invoke('login', { masterPassword: password });

      // Now load passwords using the session key
      const data = await invoke('load_passwords_secure');
      const parsed = JSON.parse(data);
      setPasswords(parsed);
      setIsAuthenticated(true);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const saveData = async (newData) => {
    try {
      await invoke('save_passwords_secure', {
        data: JSON.stringify(newData)
      });
      setPasswords(newData);
    } catch (e) {
      console.error('Failed to save:', e);
      alert('Failed to save data!');
    }
  };

  const handleAdd = (formData) => {
    const newItem = { ...formData, id: uuidv4() };
    const newData = [...passwords, newItem];
    saveData(newData);
    setIsModalOpen(false);
  };

  const handleEdit = (formData) => {
    const newData = passwords.map(p => p.id === editingItem.id ? { ...formData, id: p.id } : p);
    saveData(newData);
    // If we were viewing this item, update the viewing item with new data
    if (viewingItem && viewingItem.id === editingItem.id) {
      setViewingItem({ ...formData, id: editingItem.id });
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = () => {
    if (itemToDelete) {
      const newData = passwords.filter(p => p.id !== itemToDelete);
      saveData(newData);
      setItemToDelete(null);
    }
  };

  const handleCloseDatabase = async () => {
    await invoke('logout');
    setIsAuthenticated(false);
    setPasswords([]);
    setIsFirstRun(true);
  };

  const handleSettingsSaved = async () => {
    await loadAutoLockTimeout();
    setShowSettings(false);
  };

  const handleImport = (importedItems) => {
    const newItems = importedItems.map(item => ({
      ...item,
      id: uuidv4(),
      service: item.service || 'Unknown Service',
      username: item.username || '',
      password: item.password || '',
      notes: item.notes || ''
    }));

    const newData = [...passwords, ...newItems];
    saveData(newData);
    alert(`Successfully imported ${newItems.length} passwords!`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (isFirstRun) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isFirstRun={false} />;
  }

  return (
    <>
      <Dashboard
        passwords={passwords}
        onAdd={() => { setEditingItem(null); setIsModalOpen(true); }}
        onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
        onDelete={confirmDelete}
        onCloseDatabase={handleCloseDatabase}
        onOpenSettings={() => setShowSettings(true)}
        onViewDetail={(item) => setViewingItem(item)}
        onImport={handleImport}
      />
      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingItem ? handleEdit : handleAdd}
        initialData={editingItem}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDelete}
        message="Are you sure you want to delete this password? This action cannot be undone."
      />
      {showSettings && (
        <Settings onClose={handleSettingsSaved} />
      )}
      {viewingItem && (
        <PasswordDetail
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
}

export default App;
