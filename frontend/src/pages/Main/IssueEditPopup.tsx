// 보드 이슈 수정 팝업
import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { ko } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { projectService, ProjectMember } from '../../api/projectService';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './IssueCreatePopup.css';

interface IssueEditPopupProps {
  issue: {
    id: number;
    title: string;
    description: string;
    status: string;
    start_date?: string;
    end_date?: string;
    assignee_id: string | null;
    assignee_name?: string;
  };
  onClose: () => void;
  onSave: (updated: any) => void;
  projectId: number;
  projectName: string;
}

interface FormState {
  title: string;
  description: string;
  status: string;
  assigneeId: string;
  assigneeName: string;
  startTime: {
    ampm: string;
    hour: string;
    minute: string;
  };
  endTime: {
    ampm: string;
    hour: string;
    minute: string;
  };
}

const IssueEditPopup: React.FC<IssueEditPopupProps> = ({ issue, onClose, onSave, projectId, projectName }) => {
  const { user } = useAuth();
  
  console.log('Issue data received:', issue); // 디버깅용 로그 추가
  
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  
  // form 초기 상태 설정
  const initialForm: FormState = {
    title: issue.title || '',
    description: issue.description || '',
    status: issue.status || '',
    assigneeId: issue.assignee_id || '',  // 이슈의 담당자 ID를 직접 설정
    assigneeName: issue.assignee_name || '',  // 이슈의 담당자 이름을 직접 설정
    startTime: { 
      ampm: issue.start_date ? (new Date(issue.start_date).getHours() >= 12 ? '오후' : '오전') : '오전', 
      hour: issue.start_date ? (new Date(issue.start_date).getHours() % 12 || 12).toString() : '', 
      minute: issue.start_date ? new Date(issue.start_date).getMinutes().toString().padStart(2, '0') : '' 
    },
    endTime: { 
      ampm: issue.end_date ? (new Date(issue.end_date).getHours() >= 12 ? '오후' : '오전') : '오전', 
      hour: issue.end_date ? (new Date(issue.end_date).getHours() % 12 || 12).toString() : '', 
      minute: issue.end_date ? new Date(issue.end_date).getMinutes().toString().padStart(2, '0') : '' 
    },
  };
  
  const [form, setForm] = useState<FormState>(initialForm);

  // 프로젝트 멤버 조회
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const members = await projectService.getProjectMembers(projectId);
        setProjectMembers(members);
        console.log('Project members:', members);
        console.log('Current assignee_id:', issue.assignee_id);
        
        // 프로젝트 멤버가 로드된 후 담당자 설정
        if (issue.assignee_id) {
          const assignee = members.find(member => member.userId === issue.assignee_id);
          if (assignee) {
            setForm(prev => ({
              ...prev,
              assigneeId: issue.assignee_id || '',  // null일 경우 빈 문자열로 설정
              assigneeName: assignee.name
            }));
          }
        }
      } catch (error) {
        console.error('프로젝트 멤버 목록 조회 실패:', error);
      }
    };

    fetchProjectMembers();
  }, [projectId, issue.assignee_id]);

  // 디버깅을 위한 상태 변경 로그
  useEffect(() => {
    console.log('Form state updated:', form);
  }, [form]);

  const [range, setRange] = useState<any>({
    startDate: issue.start_date ? new Date(issue.start_date) : new Date(),
    endDate: issue.end_date ? new Date(issue.end_date) : new Date(),
    key: 'selection',
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('제목은 필수입니다.');
      return;
    }

    if (!form.assigneeId) {
      alert('담당자를 선택해주세요.');
      return;
    }

    try {
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

      const updatedIssue = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        assigneeId: form.assigneeId
      };

      console.log('Updating issue:', updatedIssue);
      const response = await projectService.updateIssue(projectId, issue.id, updatedIssue);
      onSave(response);
      onClose();
    } catch (error: any) {
      console.error('이슈 수정 실패:', error);
      alert(error.message || '이슈 수정에 실패했습니다.');
    }
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
          <h2>이슈 수정</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>프로젝트</label>
          <input
            type="text"
            value={projectName}
            disabled
            className="disabled-input"
          />
        </div>

        <div className="form-group">
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
          <label>담당자 *</label>
          <select
            value={form.assigneeId}
            onChange={(e) => {
              const selectedMember = projectMembers.find(member => member.userId === e.target.value);
              setForm(prev => ({
                ...prev,
                assigneeId: e.target.value,
                assigneeName: selectedMember ? selectedMember.name : ''
              }));
            }}
          >
            <option value="">담당자를 선택하세요</option>
            {projectMembers.map(member => (
              <option 
                key={member.userId} 
                value={member.userId}
              >
                {member.name} [{member.userId}]
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>첨부 파일</label>
          <div className="file-drop-area">첨부파일을 마우스로 끌어 놓아보세요.</div>
        </div>

        <div className="popup-footer right-align">
          <div className="footer-actions">
            <div className="reporter">보고자: {user?.userId}</div>
            <div className="popup-buttons">
              <button className="cancel-button" onClick={onClose}>취소</button>
              <button className="create-button" onClick={handleSubmit}>저장</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueEditPopup;
