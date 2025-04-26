// -------------------------------
// NOTIFICATION SERVICE - TOAST MANAGEMENT
// -------------------------------
// Features:
// 1. Context-based notifications
// 2. Multiple notification types
// 3. Auto-dismiss functionality
// -------------------------------

import { createContext, useState, useContext, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      
      <AnimatePresence>
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`p-3 rounded-lg flex items-center space-x-2 ${
                notification.type === "error" ? "bg-red-500" :
                notification.type === "success" ? "bg-green-500" :
                "bg-blue-500"
              }`}
            >
              <span className="text-white">{notification.message}</span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};