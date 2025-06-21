import React, { useState, useEffect, useRef } from "react";
import { Bell, Settings, User, ChevronDown, LogOut, UserCircle, Mail, Bell as BellIcon, Settings as SettingsIcon } from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import ProjectTab from "./ProjectTab";
import { Project } from "../../types/project";
import { projectService, RecentWork } from "../../api/projectService";
import { recentProjectService } from "../../api/recentService";
import "./Main.css";
import "./Mainrecommend.css";
import RecentWorkView from './RecentWorkView';
import UnresolvedIssueView from './UnresolvedIssueView';
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/role";
import ResultPopup from "../../components/ResultPopup";
import siteService, { Site } from "../../api/siteService";
import TeamPage from "../Team/TeamPage";
import ActivityLogView from './ActivityLogView';
import { activityService } from "../../api/activityService";
import { ActivityLog } from "../../types/activity";

type TabType = 'recommend' | 'recent' | 'project' | 'dashboard' | 'team';
type RecommendSubTab = 'recent' | 'unresolved';

const tabList: { id: TabType; label: string; icon: string }[] = [
  { id: 'recommend', label: '추천 항목', icon: '/assets/icon_recommend.png' },
  { id: 'recent', label: '최근', icon: '/assets/icon_recent.png' },
  { id: 'project', label: '프로젝트', icon: '/assets/icon_project.png' },
  { id: 'dashboard', label: '대시보드', icon: '/assets/icon_dashboard.png' },
  { id: 'team', label: '팀', icon: '/assets/icon_team.png' },
];

const subtabs = ['recent', 'unresolved'] as const;

interface Notification {
  id: number;
  type: 'comment' | 'mention' | 'issue' | 'project';
  message: string;
  time: string;
  isRead: boolean;
  icon: 'bell' | 'mail';
}

const Main = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { siteId } = useParams<{ siteId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [recommendSubTab, setRecommendSubTab] = useState<RecommendSubTab>('recent');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentViewFilter, setRecentViewFilter] = useState<'my' | 'all'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentWorks, setRecentWorks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [unresolvedIssues, setUnresolvedIssues] = useState<any[]>([]);
  const [menuOpenProjectId, setMenuOpenProjectId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");
  const [activePopup, setActivePopup] = useState<'notifications' | 'settings' | 'profile' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ type: string | null, message?: string }>({ type: null });
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'comment',
      message: '새로운 댓글이 달렸습니다: "이 부분 확인해주세요"',
      time: '방금 전',
      isRead: false,
      icon: 'bell'
    },
    {
      id: 2,
      type: 'mention',
      message: '@사용자님이 회의록에서 멘션했습니다',
      time: '10분 전',
      isRead: false,
      icon: 'mail'
    },
    {
      id: 3,
      type: 'issue',
      message: '새로운 이슈가 할당되었습니다: "로그인 버그 수정"',
      time: '1시간 전',
      isRead: false,
      icon: 'bell'
    },
    {
      id: 4,
      type: 'project',
      message: '프로젝트 "슬라임"에 초대되었습니다',
      time: '3시간 전',
      isRead: true,
      icon: 'mail'
    },
    {
      id: 5,
      type: 'issue',
      message: '이슈 상태가 변경되었습니다: "완료됨"',
      time: '5시간 전',
      isRead: true,
      icon: 'bell'
    }
  ]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'my'>('all');

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleNotificationClick = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // 에러 메시지 처리
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // 에러 메시지를 표시한 후 state 초기화
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchProjects = async () => {
    if (!siteId) {
      console.error('사이트 ID가 없습니다.');
      setProjects([]);
      return;
    }
    
    try {
      setLoading(true);
      const parsedSiteId = Number(siteId);
      if (isNaN(parsedSiteId)) {
        console.error('잘못된 사이트 ID 형식:', siteId);
        setProjects([]);
        return;
      }

      const projectList = await projectService.getProjectsBySite(parsedSiteId);
      setProjects(projectList);
    } catch (err: any) {
      console.error('프로젝트 로딩 에러:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // 최근 프로젝트 로드
  const loadRecentProjects = async () => {
    if (!siteId || !user?.id) return;
    
    try {
      const response = await projectService.getRecentProjects(
        Number(siteId),
        user.id,
        recentViewFilter === 'my'
      );
      setRecentProjects(response);
    } catch (error) {
      console.error('최근 프로젝트 로딩 에러:', error);
      setRecentProjects([]);
    }
  };

  // 최근 작업 로드
  const loadRecentWorks = async () => {
    if (!siteId) return;
    
    try {
      setRecommendLoading(true);
      const response = await activityService.getSiteActivities(Number(siteId), user?.userId ? Number(user.userId) : undefined);
      setRecentWorks(response || []);
    } catch (error) {
      console.error('최근 작업 로딩 에러:', error);
      setRecentWorks([]);
    } finally {
      setRecommendLoading(false);
    }
  };

  // 미해결 이슈 로드
  const loadUnresolvedIssues = async () => {
    if (!siteId || !user?.id) return;
    
    try {
      setRecommendLoading(true);
      const response = await projectService.getUnresolvedIssues(Number(siteId), user.id);
      setUnresolvedIssues(response);
    } catch (error) {
      console.error('미해결 이슈 로딩 에러:', error);
      setUnresolvedIssues([]);
    } finally {
      setRecommendLoading(false);
    }
  };

  // 프로젝트 방문 처리 함수
  const handleProjectVisit = async (project: Project) => {
    try {
      // 로컬/세션 스토리지에서 사용자 정보 확인
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
      if (!storedUser || !storedUser.id) {
        console.error('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 프로젝트 방문 기록 저장
      await projectService.recordProjectVisit(project.id, storedUser.id);
      
      // 현재 프로젝트를 최근 프로젝트 목록의 맨 앞으로 이동
      setRecentProjects(prevProjects => {
        // 현재 프로젝트를 제외한 나머지 프로젝트들
        const otherProjects = prevProjects.filter(p => p.id !== project.id);
        // 현재 프로젝트를 맨 앞에 추가
        return [project, ...otherProjects].slice(0, 5); // 최대 5개까지만 유지
      });

    } catch (error) {
      console.error('프로젝트 방문 처리 실패:', error);
    }
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpenProjectId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (project: Project) => {
    console.log('삭제 클릭:', project);
    setProjectToDelete(project);
    setDeleteModalOpen(true);
    setMenuOpenProjectId(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      // 로컬/세션 스토리지에서 사용자 정보 직접 확인
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
      if (!storedUser || !storedUser.id) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!projectToDelete) {
        throw new Error('삭제할 프로젝트 정보가 없습니다.');
      }

      await projectService.deleteProject(projectToDelete.id, storedUser.id);
      await fetchProjects();
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('프로젝트 삭제 실패:', error);
      alert(error.message || '프로젝트 삭제에 실패했습니다.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  // 페이지 진입 시 사이트 멤버 권한 체크
  useEffect(() => {
    const checkSiteMember = async () => {
      // 이미 에러가 있거나 로딩 중이면 체크하지 않음
      if (error || authLoading) return;

      // 사이트 ID가 없으면 체크하지 않음
      if (!siteId) {
        setError('잘못된 사이트 ID입니다.');
        return;
      }

      // 기본 데이터 로드 (로그인 여부와 관계없이)
      try {
        await fetchProjects();
        setLoading(false); // 초기 로딩 완료
      } catch (error) {
        console.error('프로젝트 로드 에러:', error);
        setError('프로젝트 목록을 불러올 수 없습니다.');
        setLoading(false); // 에러가 발생해도 로딩 상태 해제
        return;
      }

      // 로그인한 경우에만 추가 데이터 로드
      if (user) {
        try {
          const parsedSiteId = parseInt(siteId);
          if (isNaN(parsedSiteId)) {
            throw new Error('잘못된 사이트 ID입니다.');
          }

          // 서버에서 사이트 멤버 권한 확인
          const role = await projectService.getSiteMemberRole(parsedSiteId, user.userId);
          
          // 사이트 멤버인 경우 추가 데이터 로드
          if (role) {
            try {
              await loadRecentProjects();
            } catch (error) {
              console.error('추가 데이터 로드 에러:', error);
            }
          }
        } catch (error: any) {
          console.error('사이트 멤버 체크 에러:', error);
          if (error.message.includes('사이트 멤버가 아닙니다')) {
            setError('이 사이트의 멤버가 아닙니다.');
          } else {
            setError(error.message || '사이트 멤버 권한을 확인할 수 없습니다.');
          }
        }
      }
    };

    checkSiteMember();
  }, [user, siteId, authLoading, error, location.key]);

  // 추천 탭 데이터 로드
  useEffect(() => {
    if (!loading && !error && siteId) {
      if (activeTab === 'recommend') {
        loadRecentProjects();
      }
      if (recommendSubTab === 'recent') {
        loadRecentWorks();
      } else if (recommendSubTab === 'unresolved') {
        loadUnresolvedIssues();
      }
    }
  }, [siteId, recommendSubTab, loading, error, activeTab]);

  const handleCreateProject = async () => {
    try {
      console.log('=== 프로젝트 생성 시도 ===');
      console.log('loading:', loading);
      console.log('user:', user);
      console.log('siteId:', siteId);
      console.log('isAuthenticated:', !!user);
      console.log('======================');

      // 로딩 중이거나 사이트 ID가 없으면 취소
      if (loading) {
        console.log('로딩 중, 프로젝트 생성 취소');
        return;
      }

      if (!siteId) {
        console.log('사이트 ID가 없음');
        setError('잘못된 사이트 ID입니다.');
        return;
      }

      // 로그인 상태가 아닌 경우
      if (!user) {
        console.log('사용자가 로그인하지 않음, 로그인 페이지로 리다이렉트');
        navigate('/login', { 
          state: { 
            from: `/sites/${siteId}/main`,
            message: '프로젝트 생성을 위해 로그인이 필요합니다.' 
          } 
        });
        return;
      }

      // 사이트 멤버 권한 체크는 로그인 상태일 때만 수행
      const parsedSiteId = parseInt(siteId);
      if (isNaN(parsedSiteId)) {
        throw new Error('잘못된 사이트 ID입니다.');
      }

      // 사이트 멤버 권한 확인
      console.log('사이트 멤버 권한 확인 시작');
      const role = await projectService.getSiteMemberRole(parsedSiteId, user.userId);
      console.log('Site member role response:', role);
      
      // ADMIN 또는 PM만 프로젝트 생성 가능
      if (role !== UserRole.ADMIN && role !== UserRole.PM) {
        console.log('권한 없음:', role);
        throw new Error('프로젝트 생성 권한이 없습니다. ADMIN 또는 PM만 프로젝트를 생성할 수 있습니다.');
      }

      // 권한이 있으면 프로젝트 생성 페이지로 이동
      console.log('프로젝트 생성 페이지로 이동');
      navigate(`/create/project/${siteId}`);
    } catch (error: any) {
      console.error('프로젝트 생성 권한 체크 에러:', error);
      if (error.message.includes('로그인이 필요합니다')) {
        navigate('/login', { 
          state: { 
            from: `/sites/${siteId}/main`,
            message: '프로젝트 생성을 위해 로그인이 필요합니다.' 
          } 
        });
      } else if (error.message.includes('사이트 멤버가 아닙니다')) {
        setError('이 사이트의 멤버가 아닙니다.');
      } else {
        setError(error.message || '프로젝트 생성 권한을 확인할 수 없습니다.');
      }
    }
  };

  // 팝업 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setActivePopup(null);
    setPopup({ type: 'result', message: '로그아웃되었습니다.' });
    
    // 1초 후 팝업을 닫고 landing 페이지로 이동
    setTimeout(() => {
      setPopup({ type: null });
      navigate('/');
    }, 1000);
  };

  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await siteService.getMySites();
        setSites(response || []);
      } catch (error) {
        console.error('사이트 목록을 불러오는데 실패했습니다:', error);
      }
    };

    fetchSites();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [siteId, location.key]);

  useEffect(() => {
    loadRecentProjects();
  }, [siteId, recentViewFilter, location.key]);

  useEffect(() => {
    if (recommendSubTab === 'recent') {
      loadRecentWorks();
    } else if (recommendSubTab === 'unresolved') {
      loadUnresolvedIssues();
    }
  }, [siteId, recommendSubTab, location.key]);

  // 활동 로그 로드
  const loadActivities = async () => {
    if (!siteId) return;
    
    try {
      setActivitiesLoading(true);
      console.log('활동 내역 로딩 시작:', { siteId });
      const response = await activityService.getSiteActivities(Number(siteId), user?.userId ? Number(user.userId) : undefined);
      console.log('활동 내역 로딩 결과:', response);
      setActivities(response || []);
    } catch (error) {
      console.error('활동 내역 로딩 에러:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'project' && selectedProjectIndex !== null) {
      const selectedProject = projects[selectedProjectIndex];
      if (selectedProject) {
        await handleProjectVisit(selectedProject);
      }
    }
    // 최근 탭으로 변경될 때 활동 내역 로드
    if (tab === 'recent') {
      loadActivities();
    }
  };

  // 프로젝트 선택 핸들러 추가
  const handleProjectSelect = async (project: Project, index: number) => {
    setSelectedProjectIndex(index);
    await handleProjectVisit(project);
    handleTabChange('project');
  };

  // 활동 내역 필터 변경 시에도 다시 로드
  useEffect(() => {
    if (activeTab === 'recent') {
      loadActivities();
    }
  }, [siteId, activityFilter, user?.userId, activeTab]);

  // 활동 클릭 핸들러
  const handleActivityClick = (activity: ActivityLog) => {
    // 활동 내역의 content를 파싱하여 필요한 정보 추출
    const content = activity.content.toLowerCase();
    
    if (content.includes('댓글')) {
      // 댓글 관련 활동인 경우 해당 프로젝트의 상세 페이지로 이동
      setActiveTab('project');
      const project = projects.find(p => p.name === activity.projectName);
      if (project) {
        setSelectedProjectIndex(projects.indexOf(project));
      }
    } else {
      // 그 외의 경우 해당 프로젝트로 이동
      setActiveTab('project');
      const project = projects.find(p => p.name === activity.projectName);
      if (project) {
        setSelectedProjectIndex(projects.indexOf(project));
      }
    }
  };

  // 로딩 중이거나 에러가 있을 때 표시할 컴포넌트
  if (loading) {
    return (
      <div className="loading-container">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  // 프로젝트 목록이 없을 때 표시할 컴포넌트
  const EmptyProjectView = () => (
    <div className="empty-project">
      <p>프로젝트가 없습니다.</p>
      <Link className="link" to={`/create/project/${siteId}`}>프로젝트 만들기</Link>
      <img src="/assets/icon_logo_hing.png" alt="logo_img" />
    </div>
  );

  return (
    <div className="main-layout">
      <div className="content-wrapper">
        {/* === 헤더 === */}
        <header className="top-bar">
          <div className="logo_section_wrapper">
            <div className="logo_section">
              <h1>
                <img src="/assets/icon_logo.png" alt="Slime Logo" className="logo_img" />
                s<span className="logo_text">lime</span>
              </h1>
            </div>
          </div>
          <div className="search-actions">
            <input type="text" placeholder="검색" className="search-input" />
          </div>
          <div className="icon-group" ref={popupRef}>
            <div className="icon-wrapper">
              <Bell 
                className="icon"
                onClick={() => {
                  if (activePopup === 'notifications') {
                    setActivePopup(null);
                  } else {
                    setActivePopup('notifications');
                  }
                }}
              />
              {unreadCount > 0 && (
                <div className="notification-badge">{unreadCount}</div>
              )}
              {activePopup === 'notifications' && (
                <div className="popup-menu notifications-menu">
                  <div className="popup-menu-header">
                    <h3>알림</h3>
                    <Link to="/notifications" className="view-all-link" onClick={() => setActivePopup(null)}>
                      모두 보기
                    </Link>
                  </div>
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`popup-menu-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      {notification.icon === 'bell' ? <BellIcon size={16} /> : <Mail size={16} />}
                      <div className="notification-content">
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="icon-wrapper">
              <Settings 
                className="icon"
                onClick={() => setActivePopup(activePopup === 'settings' ? null : 'settings')}
              />
              {activePopup === 'settings' && (
                <div className="popup-menu">
                  <div className="popup-menu-item">
                    <SettingsIcon size={16} />
                    <span>설정</span>
                  </div>
                  <div className="popup-menu-divider" />
                  <div className="popup-menu-item">
                    <span>테마 설정</span>
                  </div>
                  <div className="popup-menu-item">
                    <span>알림 설정</span>
                  </div>
                </div>
              )}
            </div>

            <div className="icon-wrapper">
              <User 
                className="icon"
                onClick={() => setActivePopup(activePopup === 'profile' ? null : 'profile')}
              />
              {activePopup === 'profile' && (
                <div className="popup-menu">
                  <div className="profile-header">
                    <h4 className="profile-name">{user?.name || '사용자'}</h4>
                    <p className="profile-email">{user?.email}</p>
                  </div>
                  <div className="popup-menu-section">
                    <h3>내 사이트</h3>
                    <Link to="/site" className="view-all-link" onClick={() => setActivePopup(null)}>
                      사이트로 이동
                    </Link>
                  </div>
                  <div className="sites-list">
                    {sites.map(site => (
                      <div 
                        key={site.id} 
                        className="site-item"
                        onClick={() => {
                          setActivePopup(null);
                          navigate(`/sites/${site.id}/main`);
                        }}
                      >
                        {site.name}
                      </div>
                    ))}
                  </div>
                  <div className="popup-menu-divider" />
                  <div className="popup-menu-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>로그아웃</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* === 사이드바 === */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <div key={tab.id} className="tab-item-wrapper">
                  <div className={`tab-item-with-plus ${isActive ? 'tab-active' : ''}`}>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`tab-button ${isActive ? 'tab-button-active' : ''}`}
                    >
                      <img
                        src={`${tab.icon}?v=1`}
                        alt={tab.label}
                        className={`tab-icon ${isActive ? 'tab-icon-active' : ''}`}
                      />
                      {tab.label}
                    </button>

                    {tab.id === 'project' && (
                      <button onClick={handleCreateProject} className="tab-plus-button" title="프로젝트 만들기">
                        <img src="/assets/plus.png" alt="프로젝트 추가" />
                      </button>
                    )}
                  </div>

                  {tab.id === 'project' && (
                    <div className="project-sublist">
                      {!loading && projects.map((project, index) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project, index)}
                          className={`project-sublist-item ${selectedProjectIndex === index ? 'active' : ''}`}
                        >
                          • [{project.name}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* === 메인 콘텐츠 === */}
        <main className="main-content">
          {activeTab === 'recommend' && (
            <div className="recommend-tab">
              <h2 className="section-title">추천 항목</h2>
              {!loading && projects.length === 0 && <EmptyProjectView />}
              
              {/* 프로젝트 리스트 */}
              {!loading && projects.length > 0 && (
                <div className="project-list">
                  {recentProjects.slice(0, 5).map((project) => (
                    <div key={project.id} className="project-card">
                      <div className="card-header">
                        <div className="card-text">
                          <h3>프로젝트</h3>
                          <h4>{project.name}</h4>
                        </div>
                      </div>
                      <button
                        className="view-button"
                        onClick={() => handleProjectSelect(project, projects.findIndex(p => p.id === project.id))}
                      >
                        보기
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtabs */}
              {!loading && (
                <>
                  <div className="recommend-subtab">
                    {subtabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRecommendSubTab(tab)}
                        className={`recommend-subtab-button ${
                          recommendSubTab === tab ? 'active' : ''
                        }`}
                      >
                        {tab === 'recent' ? '최근 작업' : '미해결 이슈'}
                      </button>
                    ))}
                  </div>

                  <div className="recommend-content">
                    {recommendLoading ? (
                      <div className="loading-container">
                        <p>로딩 중...</p>
                      </div>
                    ) : (
                      <>
                        {recommendSubTab === 'recent' && <RecentWorkView recentWorks={recentWorks} />}
                        {recommendSubTab === 'unresolved' && <UnresolvedIssueView issues={unresolvedIssues} />}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="recent-tab">
              <div className="recent-header">
                <h2 className="section-title">최근</h2>
              </div>

              {activitiesLoading ? (
                <div className="loading-message">로딩 중...</div>
              ) : (
                <ActivityLogView
                  activities={activities}
                  onActivityClick={handleActivityClick}
                />
              )}
            </div>
          )}

          {activeTab === 'project' && (
            <>
              <div className="invite-button-topright">
                <button 
                  className="invite-button"
                  onClick={() => setActiveTab('team')}
                >
                  + 팀원 초대
                </button>
              </div>
              <ProjectTab
                projects={projects}
                selectedProjectIndex={selectedProjectIndex}
                setSelectedProjectIndex={setSelectedProjectIndex}
              />
            </>
          )}

          {activeTab === 'dashboard' && <div>dashboard 탭</div>}
          {activeTab === 'team' && <TeamPage />}
        </main>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && projectToDelete && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>프로젝트 삭제</h3>
            <p>정말로 "{projectToDelete.name}" 프로젝트를 삭제하시겠습니까?</p>
            <p className="warning-text">이 작업은 되돌릴 수 없습니다.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleDeleteCancel}>
                취소
              </button>
              <button className="delete-button" onClick={handleDeleteConfirm}>
                삭제
              </button>
            </div>
          </div>
        </div>
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

export default Main;
