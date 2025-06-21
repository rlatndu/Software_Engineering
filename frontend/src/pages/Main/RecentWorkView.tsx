import React from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ActivityLog, ActivityType } from '../../types/activity';
import './RecentWorkView.css';

interface RecentWorkViewProps {
  recentWorks: ActivityLog[];
}

const RecentWorkView: React.FC<RecentWorkViewProps> = ({ recentWorks }) => {
  const getDisplayText = (activity: ActivityLog) => {
    if (!activity) return '알 수 없는 활동';
    
    switch (activity.type) {
      case 'ISSUE_STATUS_CHANGE':
        return `이슈 상태 변경: ${activity.statusChange || ''}`;
      case 'ISSUE_CREATE':
        return `이슈 생성: ${activity.title || ''}`;
      case 'ISSUE_UPDATE':
        return `이슈 수정: ${activity.content || ''}`;
      case 'COMMENT_CREATE':
        return `댓글 작성: ${activity.content || ''}`;
      case 'COMMENT_UPDATE':
        return `댓글 수정: ${activity.content || ''}`;
      case 'PAGE_NAVIGATION':
        return `페이지 이동: ${activity.content || ''}`;
      default:
        return activity.title || '알 수 없는 활동';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy/MM/dd HH:mm', { locale: ko });
    } catch (error) {
      console.error('날짜 형식 변환 에러:', error);
      return '날짜 없음';
    }
  };

  return (
    <div className="recent-work-view">
      {recentWorks.length === 0 ? (
        <div className="empty-message">
          <p>최근 작업 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="recent-work-list">
          {recentWorks.map((activity) => (
            activity && (
              <div key={activity.id} className="work-item">
                <div className="work-status">{getDisplayText(activity)}</div>
                <div className="work-info">
                  <div className="work-project">{activity.projectName || '프로젝트 없음'}</div>
                </div>
                <div className="work-time">{formatDate(activity.updatedAt)}</div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentWorkView; 