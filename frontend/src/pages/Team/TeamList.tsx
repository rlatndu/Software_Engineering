// 프로젝트 멤버 목록을 리스트 형태로 표시
// 멤버 수가 0이면 TeamPage에서 판단 후 ProjectInvite로 전환

import React from 'react';

const TeamList = ({ members }: { members: any[] }) => {
  return (
    <div className="team-list">
      <h2>팀원 목록</h2>
      <ul>
        {members.map((member, idx) => (
          <li key={idx}>
            {member.name} ({member.role})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamList;
