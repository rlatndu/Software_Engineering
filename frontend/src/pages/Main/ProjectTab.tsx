import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectBoardView from './ProjectBoardView';
import ProjectBacklogView from './ProjectBacklogView';
import { Project } from '../../types/project';
import { projectService } from '../../api/projectService';
import { useAuth } from '../../contexts/AuthContext';
import { canManageProject } from '../../utils/permissionUtils';
import ConfirmPopup from '../../components/ConfirmPopup';
import ResultPopup from '../../components/ResultPopup';
import AccessDeniedPopup from '../../components/AccessDeniedPopup';

interface ProjectTabProps {
  projects: Project[];
  selectedProjectIndex: number;
  setSelectedProjectIndex: (index: number) => void;
  children?: React.ReactNode;
}

const ProjectTab: React.FC<ProjectTabProps> = ({ projects, selectedProjectIndex, setSelectedProjectIndex, children }) => {
  const [viewTab, setViewTab] = useState<'board' | 'backlog'>('board');
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [popup, setPopup] = useState<{ type: 'accessDenied' | 'result' | null, message?: string }>({ type: null });

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
  const hasDeletePermission = user && canManageProject(user, selectedProject);

  const handleDeleteClick = () => {
    if (!hasDeletePermission) {
      setPopup({
        type: 'accessDenied',
        message: '프로젝트 삭제 권한이 없습니다.\n프로젝트 관리자만 삭제할 수 있습니다.'
      });
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!user?.id) {
        throw new Error('로그인이 필요합니다.');
      }
      await projectService.deleteProject(selectedProject.id, user.id);
      setPopup({
        type: 'result',
        message: '프로젝트가 성공적으로 삭제되었습니다.'
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setPopup({
        type: 'accessDenied',
        message: err.message || '프로젝트 삭제에 실패했습니다.'
      });
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="project-tab">
      <div className="section-header">
        <h2 className="section-title">[{selectedProject.name}]</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {children}
          {hasDeletePermission && (
            <button 
              className="invite-button"
              onClick={handleDeleteClick}
              style={{ backgroundColor: '#dc2626' }}
            >
              프로젝트 삭제
            </button>
          )}
        </div>
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

      {showDeleteConfirm && (
        <ConfirmPopup
          title="프로젝트 삭제"
          message={`"${selectedProject.name}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {popup.type === 'accessDenied' && (
        <AccessDeniedPopup
          message={popup.message || ''}
          onClose={() => setPopup({ type: null })}
        />
      )}
      {popup.type === 'result' && (
        <ResultPopup
          message={popup.message || ''}
          onClose={() => setPopup({ type: null })}
        />
      )}
    </div>
  );
};

export default ProjectTab;
