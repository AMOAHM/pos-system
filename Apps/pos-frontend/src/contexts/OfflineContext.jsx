import React, { createContext, useContext, useState, useEffect } from 'react';

const OfflineContext = createContext(null);

const DB_NAME = 'pos-offline';
const DB_VERSION = 1;

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [db, setDb] = useState(null);
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  // Initialize IndexedDB using native API
  useEffect(() => {
    initDB();
  }, []);

  const initDB = () => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database');
    };

    request.onsuccess = (event) => {
      setDb(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Store for offline sales
      if (!database.objectStoreNames.contains('sales')) {
        const salesStore = database.createObjectStore('sales', {
          keyPath: 'id',
          autoIncrement: true
        });
        salesStore.createIndex('timestamp', 'timestamp');
        salesStore.createIndex('synced', 'synced');
      }

      // Store for products cache
      if (!database.objectStoreNames.contains('products')) {
        const productsStore = database.createObjectStore('products', {
          keyPath: 'id'
        });
        productsStore.createIndex('shop_id', 'shop_id');
      }

      // Store for sync queue
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    };
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineNotification(true);
      syncOfflineData();

      // Auto-hide online notification after 3 seconds
      setTimeout(() => {
        setShowOnlineNotification(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotification(true);

      // Auto-hide offline notification after 5 seconds
      setTimeout(() => {
        setShowOfflineNotification(false);
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [db]);

  // Cache products for offline use
  const cacheProducts = async (products) => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');

      products.forEach(product => {
        store.put(product);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };

  // Get cached products
  const getCachedProducts = async (shopId) => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('shop_id');
      const request = index.getAll(shopId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Save sale offline
  const saveOfflineSale = async (saleData) => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readwrite');
      const store = tx.objectStore('sales');

      const offlineSale = {
        ...saleData,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.add(offlineSale);

      request.onsuccess = () => {
        const id = request.result;
        
        // Add to sync queue
        addToSyncQueue({
          type: 'sale',
          action: 'create',
          data: offlineSale,
          offlineId: id
        });

        resolve(id);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Add item to sync queue
  const addToSyncQueue = async (item) => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');

      const request = store.add({
        ...item,
        timestamp: Date.now(),
        attempts: 0
      });

      request.onsuccess = () => {
        loadSyncQueue();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Load sync queue
  const loadSyncQueue = async () => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        setSyncQueue(request.result);
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Sync offline data when back online
  const syncOfflineData = async () => {
    if (!db || !isOnline) return;

    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = async () => {
      const items = request.result;

      for (const item of items) {
        try {
          await syncItem(item);
          await removeFromSyncQueue(item.id);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          await updateSyncAttempts(item.id);
        }
      }

      loadSyncQueue();
    };
  };

  // Sync individual item
  const syncItem = async (item) => {
    // Import API client
    const { salesAPI } = await import('../api/sales');

    if (item.type === 'sale') {
      await salesAPI.create(item.data);

      // Mark sale as synced
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sales', 'readwrite');
        const store = tx.objectStore('sales');
        const getRequest = store.get(item.offlineId);

        getRequest.onsuccess = () => {
          const sale = getRequest.result;
          
          if (sale) {
            sale.synced = true;
            const putRequest = store.put(sale);
            
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    }
  };

  // Remove from sync queue
  const removeFromSyncQueue = async (id) => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  // Update sync attempts
  const updateSyncAttempts = async (id) => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;

        if (item) {
          item.attempts += 1;
          
          // Remove if too many attempts
          if (item.attempts > 5) {
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          } else {
            const putRequest = store.put(item);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          }
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  };

  // Manual dismiss for notifications
  const dismissOfflineNotification = () => setShowOfflineNotification(false);
  const dismissOnlineNotification = () => setShowOnlineNotification(false);

  const value = {
    isOnline,
    syncQueue,
    cacheProducts,
    getCachedProducts,
    saveOfflineSale,
    syncOfflineData,
    pendingSync: syncQueue.length,
    showOfflineNotification,
    showOnlineNotification,
    dismissOfflineNotification,
    dismissOnlineNotification
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
      
      {/* Offline Notification Toast */}
      {showOfflineNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">You're offline</p>
              <p className="text-sm opacity-90">Changes will sync when reconnected</p>
            </div>
            <button 
              onClick={dismissOfflineNotification}
              className="text-white hover:text-yellow-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Online Notification Toast */}
      {showOnlineNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">Back online</p>
              <p className="text-sm opacity-90">
                {syncQueue.length > 0 
                  ? `Syncing ${syncQueue.length} item(s)...` 
                  : 'All data synced'}
              </p>
            </div>
            <button 
              onClick={dismissOnlineNotification}
              className="text-white hover:text-green-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};