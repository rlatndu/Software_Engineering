import React, { useState } from 'react';
import './ProjectInvite.css';
import { projectService } from '../../api/projectService';
import { getCurrentUser } from '../../utils/auth';

const ProjectInvite: React.FC = () => {
  const project = JSON.parse(localStorage.getItem('project') || 'null');
  const user = getCurrentUser();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'PM' | 'MEMBER'>('MEMBER');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!project) {
    return <p className="no-project-text">현재 프로젝트가 존재하지 않습니다.</p>;
  }

  const handleInvite = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('이메일을 입력하세요.');
      return;
    }

    try {
      if (!user) throw new Error('로그인이 필요합니다.');

      if (role === 'PM') {
        const resMsg = await projectService.invitePm(project.id, email.trim(), user.id);
        setMessage(resMsg);
      } else {
        const resMsg = await projectService.inviteMember(project.id, email.trim(), user.id);
        setMessage(resMsg);
      }
      setEmail('');
    } catch (err: any) {
      setError(err.message || '초대에 실패했습니다.');
    }
  };

  return (
    <div className="team-page">
      <div className="team-content-wrapper">
        <h2 className="team-title">{project.name} 팀</h2>
        <p className="team-description">프로젝트에 초대할 팀원을 입력하세요.</p>

        <div className="invite-section">
          <label>초대 권한 / 이메일 입력</label>
          <div className="invite-row">
            <select value={role} onChange={(e) => setRole(e.target.value as 'PM' | 'MEMBER')}>
              <option value="MEMBER">일반 사용자</option>
              <option value="PM">프로젝트 관리자</option>
            </select>

            <input
              type="email"
              placeholder="이메일 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="invite-button" onClick={handleInvite}>초대하기</button>
          </div>

          {message && <p className="invite-success">{message}</p>}
          {error && <p className="invite-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProjectInvite;
