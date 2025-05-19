// 이슈 생성 팝업창

import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './IssueCreatePopup.css';

interface IssueCreatePopupProps {
  onClose: () => void;
  onCreate: (newIssue: any) => void;
}

const IssueCreatePopup: React.FC<IssueCreatePopupProps> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    assigneeId: '',
    assigneeName: '',
    startTime: { ampm: '오전', hour: '', minute: '' },
    endTime: { ampm: '오전', hour: '', minute: '' },
  });

  const [range, setRange] = useState<any>({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('제목은 필수입니다.');
      return;
    }

    const newIssue = {
      ...form,
      id: Date.now(),
      startDate: range.startDate,
      endDate: range.endDate,
    };
    onCreate(newIssue);
  };

  const handleTimeChange = (
    field: 'startTime' | 'endTime',
    key: 'ampm' | 'hour' | 'minute',
    value: string
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content issue-create-popup">
        <div className="popup-header">
          <h2>이슈 만들기</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>프로젝트 *</label>
          <select defaultValue="">
            <option disabled>[프로젝트 이름]</option>
          </select>
        </div>

        <div className="form-group">
          <label>상태 *</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="form-group">
          <label>제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="form-group">
          <label>이슈 설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="이슈에 대한 설명을 작성해보세요"
          />
        </div>

        <div className="form-group-row date-time-row">
          <div className="datetime-inputs-column">
            <label>시작 날짜</label>
            <input
              className="date-display-input"
              type="text"
              value={`${range.startDate.getFullYear()}년    ${range.startDate.getMonth() + 1}월    ${range.startDate.getDate()}일`}
              readOnly
            />
            <div className="time-inputs">
              <select value={form.startTime.ampm} onChange={(e) => handleTimeChange('startTime', 'ampm', e.target.value)}>
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <input
                type="text"
                placeholder="시"
                value={form.startTime.hour}
                onChange={(e) => handleTimeChange('startTime', 'hour', e.target.value)}
              />
              <input
                type="text"
                placeholder="분"
                value={form.startTime.minute}
                onChange={(e) => handleTimeChange('startTime', 'minute', e.target.value)}
              />
            </div>

            <label>종료 날짜</label>
            <input
              className="date-display-input"
              type="text"
              value={`${range.endDate.getFullYear()}년    ${range.endDate.getMonth() + 1}월    ${range.endDate.getDate()}일`}
              readOnly
            />
            <div className="time-inputs">
              <select value={form.endTime.ampm} onChange={(e) => handleTimeChange('endTime', 'ampm', e.target.value)}>
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <input
                type="text"
                placeholder="시"
                value={form.endTime.hour}
                onChange={(e) => handleTimeChange('endTime', 'hour', e.target.value)}
              />
              <input
                type="text"
                placeholder="분"
                value={form.endTime.minute}
                onChange={(e) => handleTimeChange('endTime', 'minute', e.target.value)}
              />
            </div>
          </div>

          <div className="calendar-wrapper">
            <DateRange
              ranges={[range]}
              onChange={(item) => setRange(item.selection)}
              months={1}
              direction="horizontal"
              locale={ko}
            />
          </div>
        </div>

        <div className="form-group">
          <label>담당자</label>
          <input
            type="text"
            placeholder="[지정된 담당자 이름]"
            value={form.assigneeName}
            onChange={(e) => setForm({ ...form, assigneeName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>첨부 파일</label>
          <div className="file-drop-area">첨부파일을 마우스로 끌어 놓아보세요.</div>
        </div>

        {/* JSX 구조 수정 */}
        <div className="popup-footer right-align">
          <div className="footer-actions">
            <div className="reporter">보고자 [작성자 이름(ID)]</div>
            <div className="popup-buttons">
              <button className="cancel-button" onClick={onClose}>취소</button>
              <button className="create-button" onClick={handleSubmit}>만들기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCreatePopup;
