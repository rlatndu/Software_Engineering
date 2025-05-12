import React from 'react';
import './ProjectBacklogView.css'

interface Project {
  id: number;
  name: string;
}

interface ProjectBacklogViewProps {
  project: Project;
}

const ProjectBacklogView: React.FC<ProjectBacklogViewProps> = ({ project }) => {
  return (
    <div className="project-backlog-view">
      <div className="backlog-column">
        <h4>Backlog (이슈 0개)</h4>
        <p>백로그가 비어있습니다. 이슈를 생성해주세요.</p>
        <button>+ 이슈 생성</button>
      </div>
      <div className="sprint-column">
        <h4>Sprint</h4>
        <p>생성된 스프린트가 없습니다.</p>
        <button>+ 스프린트 만들기</button>
      </div>
    </div>
  );
};

export default ProjectBacklogView;
