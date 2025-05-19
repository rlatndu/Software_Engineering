import React from 'react';
import './ProjectBacklogView.css';

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
        <div className="backlog-header">
          <h4>Backlog</h4>
          <span>(이슈 0개)</span>
        </div>
        <div className="backlog-box">
          <p className="empty-message">백로그가 비어있습니다.<br />이슈를 생성해주세요.</p>
        </div>
        <button className="back-create-button">+ 이슈 생성</button>
      </div>

      <div className="sprint-column">
        <div className="backlog-header">
          <h4>Sprint</h4>
        </div>
        <div className="sprint-box">
          <p className="empty-message">생성된 스프린트가 없습니다.</p>
        </div>
        <button className="b-create-button">+ 스프린트 만들기</button>
      </div>
    </div>
  );
};

export default ProjectBacklogView;
