// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import NotificationsApi from "../api/notificationsApi";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from server
  const loadNotifications = async () => {
    try {
      const res = await NotificationsApi.list();
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Mark 1 notification as read
  const markOneRead = async (id) => {
    await NotificationsApi.markRead(id);

    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  // Remove notification from list
  const removeNotification = async (id) => {
    try {
      await NotificationsApi.delete(id);
      setNotifications(prev => {
        const removed = prev.find(n => n._id === id);
        const newList = prev.filter(n => n._id !== id);
        // Decrease unread count if notification was unread
        if (removed && !removed.isRead) {
          setUnreadCount(prev => Math.max(prev - 1, 0));
        }
        return newList;
      });
    } catch (err) {
      console.error("Failed to remove notification", err);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    await NotificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // Call this after creating a user
  const pushNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loadNotifications,
      markOneRead,
      markAllRead,
      pushNotification,
      removeNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
