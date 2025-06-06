// 이슈 생성 팝업창

import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { ko } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { projectService, ProjectMember } from '../../api/projectService';
import axios from 'axios';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './IssueCreatePopup.css';

interface IssueCreatePopupProps {
  onClose: () => void;
  onCreate: (newIssue: any) => void;
  selectedColumn: string;
  projectId: number;
  projectName: string;  // 프로젝트 이름 prop 추가
  initialStatus: string;
}

const IssueCreatePopup: React.FC<IssueCreatePopupProps> = ({ onClose, onCreate, selectedColumn, projectId, projectName, initialStatus }) => {
  const { user } = useAuth();
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: initialStatus,
      //  status: initialStatus || 'TODO',
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

  // 프로젝트 멤버 목록 가져오기
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const members = await projectService.getProjectMembers(projectId);
        setProjectMembers(members);
      } catch (error) {
        console.error('프로젝트 멤버 목록 조회 실패:', error);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('제목은 필수입니다.');
      return;
    }

    if (!form.assigneeId) {
      alert('담당자를 선택해주세요.');
      return;
    }

    // 시작 시간과 종료 시간 설정
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);

    // 시작 시간 설정
    if (form.startTime.hour && form.startTime.minute) {
      let hour = parseInt(form.startTime.hour);
      if (form.startTime.ampm === '오후' && hour !== 12) hour += 12;
      if (form.startTime.ampm === '오전' && hour === 12) hour = 0;
      startDate.setHours(hour, parseInt(form.startTime.minute), 0);
    } else {
      startDate.setHours(0, 0, 0);
    }

    // 종료 시간 설정
    if (form.endTime.hour && form.endTime.minute) {
      let hour = parseInt(form.endTime.hour);
      if (form.endTime.ampm === '오후' && hour !== 12) hour += 12;
      if (form.endTime.ampm === '오전' && hour === 12) hour = 0;
      endDate.setHours(hour, parseInt(form.endTime.minute), 0);
    } else {
      endDate.setHours(23, 59, 59);
    }

    const newIssue = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString(),
      endDate: new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString(),
      columnId: parseInt(selectedColumn),
      assigneeId: form.assigneeId,
      reporterId: user?.userId,
      order: 0  // orderIndex를 order로 변경
    };

    console.log('Submitting new issue:', newIssue);
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
    <div className="n-popup-overlay">
      <div className="n-popup-content n-issue-create-popup">
        <div className="n-popup-header">
          <h2>이슈 만들기</h2>
          <button className="n-close-button" onClick={onClose}>×</button>
        </div>

        <div className="n-form-group">
          <label>프로젝트</label>
          <input
            type="text"
            value={projectName}
            disabled
            className="n-disabled-input"
          />
        </div>

        <div className="n-form-group">
          <label>상태 *</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
            {form.status !== 'TODO' && 
             form.status !== 'IN_PROGRESS' && 
             form.status !== 'DONE' && (
              <option value={form.status}>{form.status}</option>
            )}
          </select>
        </div>

        <div className="n-form-group">
          <label>제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="n-form-group">
          <label>이슈 설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="이슈에 대한 설명을 작성해보세요"
          />
        </div>

        <div className="n-form-group-row n-date-time-row">
          <div className="n-datetime-inputs-column">
            <label>시작 날짜</label>
            <input
              className="n-date-display-input"
              type="text"
              value={`${range.startDate.getFullYear()}년    ${range.startDate.getMonth() + 1}월    ${range.startDate.getDate()}일`}
              readOnly
            />
            <div className="n-time-inputs">
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
              className="n-date-display-input"
              type="text"
              value={`${range.endDate.getFullYear()}년    ${range.endDate.getMonth() + 1}월    ${range.endDate.getDate()}일`}
              readOnly
            />
            <div className="n-time-inputs">
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

          <div className="n-calendar-wrapper">
            <DateRange
              ranges={[range]}
              onChange={(item) => setRange(item.selection)}
              months={1}
              direction="horizontal"
              locale={ko}
            />
          </div>
        </div>

        <div className="n-form-group">
          <label>담당자 *</label>
          <select
            value={form.assigneeId}
            onChange={(e) => {
              const selectedMember = projectMembers.find(member => member.userId === e.target.value);
              setForm(prev => ({
                ...prev,
                assigneeId: e.target.value
              }));
            }}
          >
            <option value="">담당자를 선택하세요</option>
            {projectMembers.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.name} [{member.userId}]
              </option>
            ))}
          </select>
        </div>

        <div className="n-form-group">
          <label>첨부 파일</label>
          <div className="n-file-drop-area">첨부파일을 마우스로 끌어 놓아보세요.</div>
        </div>

        <div className="n-popup-footer n-right-align">
          <div className="n-footer-actions">
            <div className="n-reporter">보고자: {user?.userId}</div>
            <div className="n-popup-buttons">
              <button className="n-cancel-button" onClick={onClose}>취소</button>
              <button className="n-create-button" onClick={handleSubmit}>만들기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCreatePopup;
