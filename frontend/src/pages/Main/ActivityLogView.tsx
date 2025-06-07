import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ActivityLog } from '../../types/activity';
import './ActivityLogView.css';

interface ActivityLogViewProps {
  activities: ActivityLog[];
  onActivityClick: (activity: ActivityLog) => void;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activities, onActivityClick }) => {
  return (
    <div className="activity-log-container">
      {activities.length === 0 ? (
        <div className="no-activities">
          <p>활동 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="activity-item"
              onClick={() => onActivityClick(activity)}
            >
              <div className="activity-content">
                <p>{activity.description}</p>
                <div className="activity-footer">
                  <span className="project-name">{activity.projectName}</span>
                  <span className="activity-time">
                    {format(new Date(activity.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLogView; 