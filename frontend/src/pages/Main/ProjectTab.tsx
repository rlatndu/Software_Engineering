import React, { useState } from 'react';
import ProjectBoardView from './ProjectBoardView.tsx';
import ProjectBacklogView from './ProjectBacklogView';
import { Link } from 'react-router-dom';


interface Project {
  id: number;
  name: string;
}

interface ProjectTabProps {
    projects: Project[];
    selectedProjectIndex: number;
    setSelectedProjectIndex: (index: number) => void;
  }

const ProjectTab: React.FC<ProjectTabProps> = ({ projects, selectedProjectIndex }) => {
  const [viewTab, setViewTab] = useState<'board' | 'backlog'>('board');

  if (projects.length === 0) {
    return (
      <div className="project-tab">
        <div className="section-header">
          <h2 className="section-title">프로젝트</h2>
        </div>
        <div className="empty-project">
          <p>프로젝트가 없습니다.</p>
          <Link className='link' to="/Create/Project">프로젝트 만들기</Link>
          <img src="/assets/icon_logo_hing.png" alt="logo_img" />
        </div>
      </div>
    );
  }
  

  // 유효하지 않은 인덱스에 대한 예외 처리
  const selectedProject = projects[selectedProjectIndex];


  return (
    <div className="project-tab">
      <div className="section-header">
        <h2 className="section-title">[{selectedProject.name}]</h2>
        {/*<img src="/assets/ellipsis.png" alt="삭제/수정" />*/}
      </div>

      <div className="project-subtabs">
        <button
          className={viewTab === 'board' ? 'active' : ''}
          onClick={() => setViewTab('board')}
        >
          보드
        </button>
        <button
          className={viewTab === 'backlog' ? 'active' : ''}
          onClick={() => setViewTab('backlog')}
        >
          백로그
        </button>
      </div>

      {viewTab === 'board' ? (
        <ProjectBoardView project={selectedProject} />
        ) : (
        <ProjectBacklogView project={selectedProject} />
        )}

    </div>
  );
};

export default ProjectTab;
