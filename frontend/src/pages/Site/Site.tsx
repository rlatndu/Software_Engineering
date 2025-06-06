import { Bell, Settings, User, MoreVertical, LogOut, UserCircle, Settings as SettingsIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import siteService, { Site } from "../../api/siteService";
import { recentSiteService } from "../../api/recentSiteService";
import { useAuth } from "../../contexts/AuthContext";
import ResultPopup from "../../components/ResultPopup";
import "./Site.css";

const SitePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [recentSites, setRecentSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [activePopup, setActivePopup] = useState<'settings' | 'profile' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ type: string | null, message?: string }>({ type: null });

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.card-actions')) {
          setShowDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 사이트 목록 조회
      const mySites = await siteService.getMySites();
      console.log('Fetched sites:', mySites);
      setSites(mySites || []);

      // 최근 방문한 사이트 목록 조회
      const recentVisited = recentSiteService.getRecentSites();
      setRecentSites(recentVisited);
    } catch (err: any) {
      console.error("Error fetching sites:", err);
      setError(err.message || "사이트 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDeleteClick = (siteId: number) => {
    setSelectedSiteId(siteId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSiteId) return;

    try {
      await siteService.deleteSite(selectedSiteId);
      setShowDeleteConfirm(false);
      setSelectedSiteId(null);
      // 사이트 목록 새로고침
      fetchSites();
    } catch (err: any) {
      console.error("Error deleting site:", err);
      setDeleteError(err.message);
    }
  };

  // 사이트 방문 처리 함수
  const handleSiteVisit = (site: Site) => {
    recentSiteService.addRecentSite(site);
  };

  if (isLoading) {
    return (
      <div className="site-main-layout">
        <div className="site-content-wrapper">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-main-layout">
      <div className="site-content-wrapper">
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
                  <div className="profile-menu-header">
                    <div className="profile-menu-name">{user?.name || '사용자'}</div>
                    <div className="profile-menu-email">{user?.email || ''}</div>
                  </div>
                  <div className="popup-menu-item">
                    <UserCircle size={16} />
                    <span>프로필</span>
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

        {/* === 본문 === */}
        <main className="site-main-content">
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <section className="site-section">
                <h2 className="section-title">내 사이트
                  <Link to="/Create/Site" className="add-site-button">
                    <img src="/assets/plus.png" alt="사이트 추가" className="plus-icon" />
                  </Link>
                </h2>
                
                {!sites || sites.length === 0 ? (
                  <div className="empty-site">
                    <p>사이트가 없습니다.</p>
                    <Link to="/Create/Site" className="link">사이트 만들기</Link>
                    <img src="/assets/icon_logo_hing.png" alt="슬라임 아이콘" className="empty-site-image" />
                  </div>
                ) : (
                  <div className="site-list">
                    {sites.map((site) => (
                      <div key={site.id} className="site-card">
                        <div className="card-header">
                          <div className="card-text">
                            <h3>사이트</h3>
                            <h4>{site.name}</h4>
                          </div>
                          <div className="card-actions">
                            <button 
                              className="action-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(showDropdown === site.id ? null : site.id);
                              }}
                            >
                              <img src="/assets/ellipsis.png" alt="더보기" className="ellipsis-icon" />
                            </button>
                            {showDropdown === site.id && (
                              <div className="dropdown-menu">
                                <button 
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowDropdown(null);
                                    handleDeleteClick(site.id);
                                  }}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link 
                          to={`/sites/${site.id}/main`} 
                          className="view-button"
                          onClick={() => handleSiteVisit(site)}
                        >
                          사이트 보기
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="site-section">
                <h2 className="section-title">최근 방문</h2>
                {!recentSites || recentSites.length === 0 ? (
                  <div className="empty-recent">
                    방문한 사이트가 없습니다.
                  </div>
                ) : (
                  <div className="site-list">
                    {recentSites.map((site) => (
                      <div key={site.id} className="site-card">
                        <div className="card-text">
                          <h3>사이트</h3>
                          <h4>{site.name}</h4>
                        </div>
                        <Link 
                          to={`/sites/${site.id}/main`} 
                          className="view-button"
                          onClick={() => handleSiteVisit(site)}
                        >
                          사이트 보기
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>사이트 삭제</h3>
            <p>사이트 삭제 시 모든 프로젝트 및 내용이 삭제됩니다.</p>
            {deleteError && <p className="error-text">{deleteError}</p>}
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedSiteId(null);
                  setDeleteError(null);
                }}
              >
                취소
              </button>
              <button 
                className="delete-button"
                onClick={handleDeleteConfirm}
              >
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

export default SitePage;
