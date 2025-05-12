// 팝업 상태 관리 및 수정 UI 예시 포함
import React, { useState } from 'react';

interface IssueEditPopupProps {
  issue: {
    id: number;
    title: string;
    description: string;
  };
  onClose: () => void;
  onSave: (updated: { id: number; title: string; description: string }) => void;
}

const IssueEditPopup: React.FC<IssueEditPopupProps> = ({ issue, onClose, onSave }) => {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);

  const handleSave = () => {
    onSave({ id: issue.id, title, description });
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>이슈 수정</h3>
        <label>제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>설명</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="popup-buttons">
          <button onClick={handleSave}>저장</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default IssueEditPopup;
