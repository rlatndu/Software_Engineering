import React, { useState, useEffect } from 'react';
import { Bell, Settings, User, ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import './NotificationPage.css';

interface Notification {
  id: number;
  type: 'comment' | 'mention' | 'issue' | 'project';
  message: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 임시 데이터로 구현, 실제로는 API 호출로 대체
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'comment',
        message: '새로운 댓글이 달렸습니다: "이 부분 확인해주세요"',
        createdAt: '2024-03-15T10:30:00',
        isRead: false
      },
      {
        id: 2,
        type: 'mention',
        message: '@사용자님이 회의록에서 멘션했습니다',
        createdAt: '2024-03-15T09:15:00',
        isRead: false
      },
      {
        id: 3,
        type: 'issue',
        message: '새로운 이슈가 할당되었습니다: "로그인 버그 수정"',
        createdAt: '2024-03-14T16:45:00',
        isRead: true
      },
      {
        id: 4,
        type: 'project',
        message: '프로젝트 "슬라임" 에 초대되었습니다',
        createdAt: '2024-03-14T11:20:00',
        isRead: true
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes}분 전`;
    } else if (hours < 24) {
      return `${hours}시간 전`;
    } else {
      return `${days}일 전`;
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({
        ...notification,
        isRead: true
      }))
    );
  };

  if (loading) {
    return <div className="n-loading">로딩 중...</div>;
  }

  return (
    <div className="n-notification-page">
      <header className="n-top-bar">
        <div className="n-header-left">
          <button className="n-back-button" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </button>
          <h1>알림</h1>
        </div>
      </header>

      <main className="n-notification-content">
        <div className="n-notification-header">
          <h2>알림 목록</h2>
          <button className="n-read-all-button" onClick={handleMarkAllAsRead}>
            모두 읽음 표시
          </button>
        </div>

        <div className="n-notification-list">
          {notifications.length === 0 ? (
            <div className="n-empty-notifications">
              <p>알림이 없습니다.</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`n-notification-item ${notification.isRead ? 'read' : 'unread'}`}
              >
                <div className="n-notification-icon">
                  {!notification.isRead && <div className="n-unread-dot" />}
                </div>
                <div className="n-notification-details">
                  <p className="n-notification-message">{notification.message}</p>
                  <span className="n-notification-time">{formatDate(notification.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationPage; 