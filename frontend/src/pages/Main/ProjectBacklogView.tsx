import React, { useState } from 'react';
import './ProjectBacklogView.css';
import BacklogIssueDetailPopup from './BacklogIssueDetailPopup';
import { Project } from '../../types/project';
import { BacklogIssue } from '../../types/issue';

interface ProjectBacklogViewProps {
  project: Project;
}

const ProjectBacklogView: React.FC<ProjectBacklogViewProps> = ({ project }) => {
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [issues, setIssues] = useState<BacklogIssue[]>([]);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<BacklogIssue | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleCreateClick = () => {
    setIsCreatingIssue(true);
    setNewIssueTitle('');
  };

  const handleConfirm = () => {
    if (newIssueTitle.trim() === '') return;

    const newIssue: BacklogIssue = {
      id: Date.now(),
      title: newIssueTitle.trim(),
      status: 'To Do',
      reporter: '작성자 이름(ID)', // 임시 작성자
      projectId: project.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: issues.length
    };
    setIssues([...issues, newIssue]);
    setIsCreatingIssue(false);
    setNewIssueTitle('');
  };

  const handleCancel = () => {
    setIsCreatingIssue(false);
    setNewIssueTitle('');
  };

  const handleEditStart = (issueId: number, currentTitle: string) => {
    setEditingIssueId(issueId);
    setEditedTitle(currentTitle);
  };

  const handleEditConfirm = (issueId: number) => {
    if (editedTitle.trim() === '') {
      setEditingIssueId(null);
      setEditedTitle('');
      return;
    }

    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === issueId ? { ...issue, title: editedTitle.trim() } : issue
      )
    );
    setEditingIssueId(null);
    setEditedTitle('');
  };

  const handleIssueClick = (issue: BacklogIssue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  const handleDetailClose = () => {
    setSelectedIssue(null);
    setIsDetailOpen(false);
  };

  const handleDeleteIssue = () => {
    if (!selectedIssue) return;
    if (!window.confirm('정말 이 이슈를 삭제하시겠습니까?')) return;
    setIssues(issues.filter((i) => i.id !== selectedIssue.id));
    setIsDetailOpen(false);
    setSelectedIssue(null);
  };

  return (
    <div className="project-backlog-view">
      <div className="backlog-column">
        <div className="backlog-header">
          <h4>Backlog</h4>
          <span>(이슈 {issues.length}개)</span>
        </div>

        {issues.length === 0 && !isCreatingIssue && (
          <div className="backlog-box">
            <p className="empty-message">
              백로그가 비어있습니다.<br />이슈를 생성해주세요.
            </p>
          </div>
        )}

        {issues.map((issue) => (
          <div key={issue.id} className="issue-item" onClick={() => handleIssueClick(issue)}>
            <div className="issue-status"><i>{issue.status}</i></div>

            {editingIssueId === issue.id ? (
              <div className="issue-create-input">
                <input
                  type="text"
                  className="edit-input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditConfirm(issue.id);
                  }}
                  autoFocus
                />
                <div className="button-group">
                  <button onClick={() => handleEditConfirm(issue.id)}>확인</button>
                  <button onClick={() => {
                    setEditingIssueId(null);
                    setEditedTitle('');
                  }}>취소</button>
                </div>
              </div>
            ) : (
              <div
                className="issue-title"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleEditStart(issue.id, issue.title);
                }}
              >
                {issue.title}
              </div>
            )}
          </div>
        ))}

        {isCreatingIssue && (
          <div className="issue-create-input">
            <input
              type="text"
              placeholder="이슈 제목 입력"
              value={newIssueTitle}
              onChange={(e) => setNewIssueTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
            />
            <div className="button-group">
              <button onClick={handleConfirm}>확인</button>
              <button onClick={handleCancel}>취소</button>
            </div>
          </div>
        )}

        {!isCreatingIssue && (
          <button className="back-create-button" onClick={handleCreateClick}>
            + 이슈 생성
          </button>
        )}
      </div>

      <div className="sprint-column">
        <div className="backlog-header">
          <h4>Sprint</h4>
        </div>
        <div className="sprint-box">
          <p className="empty-message">생성된 스프린트가 없습니다.</p>
        </div>
        <button className="b-create-button">+ 스프린트 만들기</button>
      </div>

      {isDetailOpen && selectedIssue && (
        <BacklogIssueDetailPopup
          issue={selectedIssue}
          onClose={handleDetailClose}
          onEdit={() => alert('편집 기능은 다음 단계에서 구현됩니다.')}
          onDelete={handleDeleteIssue}
        />
      )}
    </div>
  );
};

export default ProjectBacklogView;
