import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService } from '../../../api/projectService';
import { recentProjectService } from '../../../api/recentService';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/role';
import './project.css';

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const { siteId } = useParams<{ siteId: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSiteMemberChecked, setIsSiteMemberChecked] = useState(false);

  // 로그인 및 권한 체크
  useEffect(() => {
    const checkAuthAndPermission = async () => {
      // 로딩 중이면 체크하지 않음
      if (loading) return;

      // 로그인 체크
      if (!isAuthenticated || !user) {
        console.log('사용자가 로그인하지 않음');
        navigate('/login', { 
          state: { 
            from: `/create/project/${siteId}`,
            message: '프로젝트 생성을 위해 로그인이 필요합니다.' 
          } 
        });
        return;
      }

      // 사이트 ID 체크
      if (!siteId) {
        setError('잘못된 사이트 ID입니다.');
        navigate('/');
        return;
      }

      try {
        const parsedSiteId = parseInt(siteId);
        if (isNaN(parsedSiteId)) {
          throw new Error('잘못된 사이트 ID입니다.');
        }

        // 서버에서 실제 권한 확인
        const role = await projectService.getSiteMemberRole(parsedSiteId, user.userId);
        console.log('Fetched site member role:', role);
        
        // ADMIN 또는 PM만 프로젝트 생성 가능
        if (role !== UserRole.ADMIN && role !== UserRole.PM) {
          console.log('권한 없음:', role);
          navigate(`/sites/${siteId}/main`, {
            state: {
              error: '프로젝트 생성 권한이 없습니다. ADMIN 또는 PM만 프로젝트를 생성할 수 있습니다.'
            }
          });
          return;
        }

        setIsSiteMemberChecked(true);
      } catch (error: any) {
        console.error('사이트 멤버 체크 에러:', error);
        navigate(`/sites/${siteId}/main`, {
          state: {
            error: error.message || '프로젝트 생성 권한이 없습니다.'
          }
        });
      }
    };

    checkAuthAndPermission();
  }, [user, loading, isAuthenticated, siteId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      if (!user && !loading) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!siteId) {
        throw new Error('잘못된 접근입니다.');
      }

      const parsedSiteId = parseInt(siteId);
      if (isNaN(parsedSiteId)) {
        throw new Error('잘못된 사이트 ID입니다.');
      }

      // 사용자 정보 확인
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      // 사용자 ID 확인
      if (!user.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 입력값 검증
      if (!name.trim()) {
        setError('프로젝트 이름을 입력해주세요.');
        setIsProcessing(false);
        return;
      }

      if (!key.trim()) {
        setError('프로젝트 키를 입력해주세요.');
        setIsProcessing(false);
        return;
      }

      if (!key.match(/^[A-Z0-9]{3,10}$/)) {
        setError('프로젝트 키는 3~10자의 영문대문자와 숫자만 사용 가능합니다.');
        setIsProcessing(false);
        return;
      }

      if (name.length > 30) {
        setError('프로젝트 이름은 30자를 초과할 수 없습니다.');
        setIsProcessing(false);
        return;
      }

      // 프로젝트 생성 전 다시 한번 권한 체크
      const role = await projectService.getSiteMemberRole(parsedSiteId, user?.userId || '');
      if (role !== UserRole.ADMIN && role !== UserRole.PM) {
        throw new Error('프로젝트 생성 권한이 없습니다. ADMIN 또는 PM만 프로젝트를 생성할 수 있습니다.');
      }

      // 프로젝트 생성 요청
      const projectData = {
        siteId: parsedSiteId,
        name: name.trim(),
        key: key.trim(),
        isPrivate,
        creatorId: user.id,
        creatorRole: role
      };
      
      console.log('Sending project creation request with data:', projectData);
      
      const project = await projectService.createProject(projectData);

      // 생성된 프로젝트를 최근 방문 목록에 추가
      recentProjectService.addRecentProject(project);

      // 성공 시 프로젝트 페이지로 이동
      navigate(`/sites/${siteId}/main`);
    } catch (err: any) {
      console.error('프로젝트 생성 오류:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('프로젝트 생성에 실패했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate(`/sites/${siteId}/main`);
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user || !user.userId) {
    return null; // 로그인 체크 useEffect에서 리다이렉트 처리
  }

  if (!isSiteMemberChecked) {
    return <div>권한을 확인하는 중...</div>;
  }

  return (
    <div className="project-create-page">
      <div className="content-wrapper">
        <div className="form-wrapper">
          <h2 className="form-title">프로젝트 생성하기</h2>

          <form className="project-form" onSubmit={handleSubmit}>
            <div className="group">
              <div className="form-groups-wrapper">
                <div className="form-group">
                  <label htmlFor="name">이름 *</label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="프로젝트 이름을 입력해주세요"
                    disabled={isProcessing}
                    maxLength={30}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="key">key *</label>
                  <input
                    id="key"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="3~10자의 영문대문자와 숫자"
                    disabled={isProcessing}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="access">액세스 *</label>
                  <select
                    id="access"
                    value={isPrivate ? 'private' : 'public'}
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                    disabled={isProcessing}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {error && <p className="error-text">{error}</p>}
              </div>

              <div className="character-wrapper">
                <img src="/assets/icon_logo_left.png" className="character-image" alt="logo character" />
              </div>
            </div>

            <div className="form-buttons">
              <button 
                type="button" 
                className="cancel" 
                onClick={handleCancel}
                disabled={isProcessing}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="submit"
                disabled={isProcessing}
              >
                {isProcessing ? "생성 중..." : "프로젝트 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 배경 쉐이프 이미지 */}
      <div className="shapes">
        <img src="/assets/shapes_darkblue.png" className="shapes1" alt="shape1" />
        <img src="/assets/shapes_blue.png" className="shapes2" alt="shape2" />
        <img src="/assets/shapes_sky.png" className="shapes3" alt="shape3" />
      </div>
    </div>
  );
};

export default ProjectCreatePage;
