import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ActivityLog, ActivityType } from '../../types/activity';
import { useAuth } from '../../contexts/AuthContext';
import './ActivityLogView.css';

interface ActivityLogViewProps {
  activities: ActivityLog[];
  onActivityClick: (activity: ActivityLog) => void;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activities = [], onActivityClick }) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ActivityType | 'ALL'>('ALL');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const getDisplayText = (activity: ActivityLog) => {
    if (!activity) return '알 수 없는 활동';
    
    const getLocationText = () => {
      if (activity.projectName && activity.issueName) {
        return `[${activity.projectName} - ${activity.issueName}]`;
      }
      return activity.projectName ? `[${activity.projectName}]` : '';
    };
    
    switch (activity.type) {
      case 'ISSUE_STATUS_CHANGE':
        return `이슈 상태 변경: ${activity.statusChange || ''}`;
      case 'ISSUE_CREATE':
        return `이슈 생성: ${activity.title || ''}`;
      case 'ISSUE_UPDATE':
        return `이슈 수정: ${activity.content || ''}`;
      case 'COMMENT_CREATE':
        return `${getLocationText()} 댓글 작성: ${activity.content || ''}`;
      case 'COMMENT_UPDATE':
        return `${getLocationText()} 댓글 수정: ${activity.content || ''}`;
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

  const filteredActivities = activities
    .filter(activity => activity)
    .filter(activity => !showOnlyMine || (user && activity.userId === user.id))
    .filter(activity => selectedType === 'ALL' || activity.type === selectedType);

  return (
    <div className="activity-log-container">
      <div className="activity-filter">
        <div className="filter-row">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as ActivityType | 'ALL')}
            className="filter-select"
          >
            <option value="ALL">모든 활동</option>
            <option value="ISSUE_STATUS_CHANGE">상태 변경</option>
            <option value="ISSUE_CREATE">이슈 생성</option>
            <option value="ISSUE_UPDATE">이슈 수정</option>
            <option value="COMMENT_CREATE">댓글 작성</option>
            <option value="COMMENT_UPDATE">댓글 수정</option>
            <option value="PAGE_NAVIGATION">페이지 이동</option>
          </select>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
            />
            내 활동만 보기
          </label>
        </div>
      </div>
      {!activities || filteredActivities.length === 0 ? (
        <div className="no-activities">
          <p>활동 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="activity-list">
          {filteredActivities.map((activity) => (
            activity && (
              <div
                key={activity.id}
                className="activity-item"
                onClick={() => onActivityClick(activity)}
              >
                <div className="activity-content">
                  <p>{getDisplayText(activity)}</p>
                  <div className="activity-footer">
                    <span className="project-name">{activity.projectName || '프로젝트 없음'}</span>
                    <span className="activity-time">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLogView; 