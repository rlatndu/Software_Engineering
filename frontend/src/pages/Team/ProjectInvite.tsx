import React from 'react';
import './ProjectInvite.css';

const TeamPage = () => {
  const project = JSON.parse(localStorage.getItem('project') || 'null'); // 예시로 프로젝트 가져오기
  const user = JSON.parse(localStorage.getItem('user') || '{}'); // 현재 로그인 사용자

  const isAdmin = user.role === 'ADMIN';
  const isProjectManager = user.role === 'PROJECT_MANAGER';

  return (
    <div className="team-page">
      <div className="team-content-wrapper">
        {project ? (
          <>
            <h2 className="team-title">{project.name} 팀</h2>
            <p className="team-description">프로젝트에 초대할 팀원을 선택하세요.</p>

            <div className="invite-section">
              <label>초대 권한</label>
              <select disabled>
                <option>
                  {isAdmin ? '프로젝트 관리자' : '일반 사용자'}
                </option>
              </select>

              <input type="email" placeholder="이메일 입력" />
              <button className="invite-button">초대하기</button>
            </div>
          </>
        ) : (
          <p className="no-project-text">현재 프로젝트가 존재하지 않습니다.</p>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
