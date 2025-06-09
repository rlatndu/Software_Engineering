import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectInvite from './ProjectInvite';
import TeamList from './TeamList';
import { projectService } from '../../api/projectService';
import { ProjectMember } from '../../types/project';

const TeamPage = () => {
  const { siteId } = useParams();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    try {
      const storedProject = JSON.parse(localStorage.getItem('project') || 'null');
      if (!storedProject) return;

      const memberList = await projectService.getProjectMembers(storedProject.id);
      setMembers(memberList); // ✅ 변수명 일치
    } catch (error) {
      console.error('팀원 로딩 오류:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return members.length > 0
    ? <TeamList members={members} />
    : <ProjectInvite />;
};

export default TeamPage;
