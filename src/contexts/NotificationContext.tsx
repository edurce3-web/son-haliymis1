import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { WS_BASE_URL } from '../lib/api';

export interface Notification {
  id: string;
  type: 'course_update' | 'live_class' | 'message' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // const { user, isAuthenticated } = useAuth();
  const user = null;
  const isAuthenticated = false;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // WebSocket bağlantısı kur
    const ws = new WebSocket(`${WS_BASE_URL}/ws/notifications/${user.user_id}`);
    
    ws.onopen = () => {
      console.log('Notification WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          const notification: Notification = {
            id: data.id || Date.now().toString(),
            type: data.notificationType || 'system',
            title: data.title,
            message: data.message,
            timestamp: new Date(data.timestamp || Date.now()),
            read: false,
            data: data.data
          };

          addNotification(notification);
          
          // Toast bildirimi göster
          toast(notification.title, {
            description: notification.message,
            action: notification.type === 'live_class' ? {
              label: 'Katıl',
              onClick: () => {
                if (notification.data?.classId && notification.data?.courseId) {
                  window.location.href = `/live-class/${notification.data.courseId}/${notification.data.classId}`;
                }
              }
            } : undefined
          });
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    ws.onclose = () => {
      console.log('Notification WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
