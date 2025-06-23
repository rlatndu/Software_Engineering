import React, { useEffect, useState } from 'react';
import './ProjectInvite.css';
import { invitationService } from '../../api/invitationService';
import { getCurrentUser } from '../../utils/auth';
import { projectService } from '../../api/projectService';
import { useParams } from 'react-router-dom';

interface InviteProps { project: { id: number; name: string }; onClose: () => void }

const ProjectInvite: React.FC<InviteProps> = ({ project, onClose }) => {
  // 잘못된 렌더링 방지
  if (!project) return null;

  const user = getCurrentUser();
  const { siteId } = useParams();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'PM' | 'MEMBER'>('MEMBER');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 사이트에서 내 역할 조회 → ADMIN이면 PM 초대, 아니면 MEMBER 초대
    const fetchRole = async () => {
      if (!user || !siteId) return;
      try {
        const mySiteRole = await projectService.getSiteMemberRole(Number(siteId), user.userId);
        if (mySiteRole === 'ADMIN') {
          setRole('PM');
        } else {
          setRole('MEMBER');
        }
      } catch (e) {
        // 기본값 유지(MEMBER)
      }
    };
    fetchRole();
  }, [siteId, user]);

  const handleInvite = async () => {
    setMessage(null);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('이메일을 입력하세요.');
      return;
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      if (!user) throw new Error('로그인이 필요합니다.');

      const resMsg = await invitationService.inviteToProject(project.id, trimmed, user.id, role);
      setMessage(resMsg);
      setEmail('');
    } catch (err: any) {
      // 서버에서 내려준 메시지가 있으면 우선 사용
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('초대에 실패했습니다.');
      }
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={e=>e.stopPropagation()}>
        <button className="close-icon" onClick={onClose}>✕</button>
        <div className="team-page modal-inner">
          <h2 className="team-title">{project.name} 팀</h2>
          <p className="team-description">프로젝트에 초대할 팀원을 입력하세요.</p>

          <div className="invite-section">
            <label>초대 권한: {role === 'PM' ? '프로젝트 관리자' : '일반 사용자'}</label>
            <div className="invite-row">
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
    </div>
  );
};

export default ProjectInvite;
