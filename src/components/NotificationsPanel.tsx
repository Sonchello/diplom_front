import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NotificationsPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBell, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionNeeded: boolean;
  request: {
    id: number;
    description: string;
  };
  fromUser: {
    id: number;
    name: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/notifications/user/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`http://localhost:8080/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleConfirmHelp = async (requestId: number) => {
    try {
      await axios.post(`http://localhost:8080/api/requests/${requestId}/confirm-help?userId=${userId}`);
      fetchNotifications(); // Обновляем список уведомлений
    } catch (error) {
      console.error('Error confirming help:', error);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h2>
          <FontAwesomeIcon icon={faBell} /> Уведомления
        </h2>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="notifications-content">
        {loading ? (
          <div className="loading">Загрузка уведомлений...</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">Нет новых уведомлений</div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
              {notification.actionNeeded && !notification.isRead && (
                <div className="notification-actions">
                  <button 
                    className="confirm-button"
                    onClick={() => handleConfirmHelp(notification.request.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Подтвердить
                  </button>
                </div>
              )}
              {!notification.isRead && (
                <button 
                  className="mark-read-button"
                  onClick={() => markAsRead(notification.id)}
                >
                  Отметить как прочитанное
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel; 