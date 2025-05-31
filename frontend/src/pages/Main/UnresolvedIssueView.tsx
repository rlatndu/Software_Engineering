import React from 'react';
import './UnresolvedIssueView.css';

interface UnresolvedIssue {
  id: number;
  title: string;
  projectName: string;
  priority: string;
  dueDate: string;
}

interface UnresolvedIssueViewProps {
  issues: UnresolvedIssue[];
}

const UnresolvedIssueView: React.FC<UnresolvedIssueViewProps> = ({ issues }) => {
  return (
    <div className="unresolved-issue-view">
      {issues.length === 0 ? (
        <div className="empty-message">
          <p>미해결 이슈가 없습니다.</p>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <div key={issue.id} className="issue-item">
              <div className="issue-priority">{issue.priority}</div>
              <div className="issue-info">
                <div className="issue-title">{issue.title}</div>
                <div className="issue-project">{issue.projectName}</div>
              </div>
              <div className="issue-due-date">{issue.dueDate}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnresolvedIssueView; 