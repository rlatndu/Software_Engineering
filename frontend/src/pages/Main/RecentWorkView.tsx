import React from 'react';
import './RecentWorkView.css';

interface RecentWork {
  id: number;
  description: string;
  projectName: string;
  updatedAt: string;
}

interface RecentWorkViewProps {
  recentWorks: RecentWork[];
}

const RecentWorkView: React.FC<RecentWorkViewProps> = ({ recentWorks }) => {
  return (
    <div className="recent-work-view">
      {recentWorks.length === 0 ? (
        <div className="empty-message">
          <p>최근 작업 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="recent-work-list">
          {recentWorks.map((work) => (
            <div key={work.id} className="work-item">
              <div className="work-info">
                <div className="work-description">{work.description}</div>
                <div className="work-project">{work.projectName}</div>
              </div>
              <div className="work-time">{work.updatedAt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentWorkView; 