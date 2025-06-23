import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService, ProjectWithMembers } from '../../api/projectService';
import './TeamPage.css';
import ProjectInvite from './ProjectInvite';

const TeamPage: React.FC = () => {
  const { siteId } = useParams();
  const [sections, setSections] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteProject, setInviteProject] = useState<ProjectWithMembers | null>(null);

  useEffect(() => {
    if (!siteId) return;
    projectService.getProjectsWithMembers(Number(siteId))
      .then(setSections)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [siteId]);

  const openInviteModal = (proj: ProjectWithMembers) => setInviteProject(proj);
  const closeInviteModal = () => setInviteProject(null);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="team-page">
      {sections.map(sec => (
        <div key={sec.projectId} className="team-section">
          <div className="section-header">
            <h3 className="section-title">[{sec.projectName}]</h3>
            <button className="invite-btn" onClick={() => openInviteModal(sec)}>+ 초대</button>
          </div>
          {sec.members.length > 0 ? (
            <div className="member-list">
              {sec.members.map(m => (
                <span key={m.userId} className="member-chip">
                  {m.userId}
                  <span className={`role-badge ${m.role}`}>{m.role}</span>
                </span>
              ))}
            </div>
          ) : (
            <p>팀원이 없습니다.</p>
          )}
        </div>
      ))}
      {inviteProject && (
        <ProjectInvite project={{id: inviteProject.projectId, name: inviteProject.projectName}} onClose={closeInviteModal} />
      )}
    </div>
  );
};

export default TeamPage;
