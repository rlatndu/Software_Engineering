import React, { useState } from 'react';
import './BacklogIssueEditPopup.css';

interface Issue {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assignee?: string;
  reporter: string;
}

interface BacklogIssueEditPopupProps {
  issue: Issue;
  onClose: () => void;
  onSave: (updated: Issue) => void;
  // 추후 삭제 기능 구현 시 사용 예정
  // onDelete: (id: number) => void;
}

const BacklogIssueEditPopup: React.FC<BacklogIssueEditPopupProps> = ({
  issue,
  onClose,
  onSave
  // onDelete
}) => {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || '');
  const [startDate, setStartDate] = useState(issue.startDate || '');
  const [endDate, setEndDate] = useState(issue.endDate || '');
  const [assignee, setAssignee] = useState(issue.assignee || '');

  const handleSave = () => {
    onSave({ ...issue, title, description, startDate, endDate, assignee });
  };

  const handleClose = () => {
    if (
      title !== issue.title ||
      description !== (issue.description || '') ||
      startDate !== (issue.startDate || '') ||
      endDate !== (issue.endDate || '') ||
      assignee !== (issue.assignee || '')
    ) {
      if (!window.confirm('편집 내용을 저장하지 않고 닫으시겠습니까?')) return;
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>이슈 편집</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <section className="modal-section">
          <label>제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </section>

        <section className="modal-section">
          <label>이슈 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이슈에 대한 설명을 입력하세요"
          />
        </section>

        <section className="modal-section">
          <label>시작 예정일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </section>

        <section className="modal-section">
          <label>마감 예정일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </section>

        <section className="modal-section">
          <label>담당자</label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="담당자 이름 입력"
          />
        </section>

        <section className="modal-section">
          <label>작성자</label>
          <input type="text" value={issue.reporter} readOnly />
        </section>

        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>취소</button>
          <button className="save-button" onClick={handleSave}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default BacklogIssueEditPopup;
