// 백로그 이슈 상세보기
import React from 'react';
//import './BacklogIssueDetailPopup.css';

interface Issue {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assignee?: string;
  reporter: string;
}

interface BacklogIssueDetailPopupProps {
  issue: Issue;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BacklogIssueDetailPopup: React.FC<BacklogIssueDetailPopupProps> = ({
  issue,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>[ {issue.title} ]</h2>
          <button className="modal-ellipsis" onClick={onDelete}>⋯</button>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <section className="modal-section">
          <h4>이슈 설명</h4>
          <p>{issue.description || '설명 편집'}</p>
        </section>

        <section className="modal-section">
          <label>시작 예정일</label>
          <input type="text" readOnly value={issue.startDate || '지정 안함'} />
        </section>

        <section className="modal-section">
          <label>마감 예정일</label>
          <input type="text" readOnly value={issue.endDate || '지정 안함'} />
        </section>

        <section className="modal-section">
          <label>담당자</label>
          <select disabled>
            <option>{issue.assignee || '할당 안함'}</option>
          </select>
        </section>

        <section className="modal-section">
          <label>작성자</label>
          <input type="text" readOnly value={issue.reporter} />
        </section>

        <div className="modal-footer">
          <button className="edit-button" onClick={onEdit}>편집</button>
        </div>
      </div>
    </div>
  );
};

export default BacklogIssueDetailPopup;
