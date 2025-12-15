import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  let notificationCounter = 0;

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${notificationCounter++}`;
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
              transform transition-all duration-300 ease-in-out
              animate-slide-up
              ${notification.type === 'success' ? 'bg-white border-success-200 text-success-800' : ''}
              ${notification.type === 'error' ? 'bg-white border-danger-200 text-danger-800' : ''}
              ${notification.type === 'warning' ? 'bg-white border-warning-200 text-warning-800' : ''}
              ${notification.type === 'info' ? 'bg-white border-primary-200 text-primary-800' : ''}
            `}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-success-500" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-danger-500" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning-500" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-primary-500" />}
            
            <p className="text-sm font-medium">{notification.message}</p>
            
            <button 
              onClick={() => removeNotification(notification.id)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
