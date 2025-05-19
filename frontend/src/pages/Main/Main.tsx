import React, { useState } from "react";
import { Bell, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectTab from "./ProjectTab";
import "./Main.css";
import "./Mainrecommend.css";

type TabType = 'recommend' | 'recent' | 'starred' | 'project' | 'dashboard' | 'team';
type RecommendSubTab = 'recent' | 'unresolved' | 'starred';

const tabList: { id: TabType; label: string; icon: string }[] = [
  { id: 'recommend', label: '추천 항목', icon: '/assets/icon_recommend.png' },
  { id: 'recent', label: '최근', icon: '/assets/icon_recent.png' },
  { id: 'starred', label: '별표 표시됨', icon: '/assets/icon_starred.png' },
  { id: 'project', label: '프로젝트', icon: '/assets/icon_project.png' },
  { id: 'dashboard', label: '대시보드', icon: '/assets/icon_dashboard.png' },
  { id: 'team', label: '팀', icon: '/assets/icon_team.png' },
];

const mockProjects = [
  { id: 1, name: "소프트웨어공학" },
  { id: 2, name: "데이터베이스개론" },
];

//const mockProjects : Project[]= [];

const subtabs = ['recent', 'unresolved', 'starred'] as const;


const Main = () => {
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [recommendSubTab, setRecommendSubTab] = useState<RecommendSubTab>('recent');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);


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
          <div className="icon-group">
            <Bell className="icon" />
            <Settings className="icon" />
            <User className="icon" />
          </div>
        </header>

        {/* === 사이드바 === */}
        <aside className="sidebar">
        <nav className="sidebar-nav">
        {tabList.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <div key={tab.id} className="tab-item-wrapper">
              {/* isActive일 때 tab-active 클래스 추가 */}
              <div className={`tab-item-with-plus ${isActive ? 'tab-active' : ''}`}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${isActive ? 'tab-button-active' : ''}`}
                >
                  <img
                    src={`${tab.icon}?v=1`}
                    alt={tab.label}
                    className={`tab-icon ${isActive ? 'tab-icon-active' : ''}`}
                  />
                  {tab.label}
                </button>

                {/* 프로젝트 탭에만 + 버튼 표시 */}
                {tab.id === 'project' && (
                  <Link to="/Create/Project" className="tab-plus-button" title="프로젝트 만들기">
                    <img src="/assets/plus.png" alt="프로젝트 추가" />
                  </Link>
                )}
              </div>


                {/* 프로젝트 하위 목록은 항상 출력되도록 처리 */}
                {tab.id === 'project' && (
                  <div className="project-sublist">
                    {mockProjects.map((project, index) => (
                      <button
                      key={project.id}
                      onClick={() => {
                        setActiveTab('project');
                        setSelectedProjectIndex(index);
                      }}
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
              {mockProjects.length === 0 ? (
                <div className="empty-project">
                  <p>프로젝트가 없습니다.</p>
                  <Link className="link" to="/Create/Project">프로젝트 만들기</Link>
                  <img src="/assets/icon_logo_hing.png" alt="logo_img" />
                </div>
              ) : (
                <div className="project-list">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="project-card">
                      <div className="cart-text">
                        <h3>프로젝트</h3>
                        <h4>{project.name}</h4>
                      </div>
                      <button>프로젝트 보기</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="recommend-subtab">
                {subtabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRecommendSubTab(tab)}
                    className={`recommend-subtab-button ${recommendSubTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'recent' ? '최근 작업' : tab === 'unresolved' ? '미해결 이슈' : '별표 표시'}
                  </button>
                ))}
              </div>

              <div className="recommend-content">
                {recommendSubTab === 'recent' && <p>최근 작업 내용 예시입니다.</p>}
                {recommendSubTab === 'unresolved' && <p>미해결 이슈 목록입니다.</p>}
                {recommendSubTab === 'starred' && <p>별표 표시된 항목입니다.</p>}
              </div>
            </div>
          )}

          {activeTab === 'recent' && <div>project 탭</div>}
          {activeTab === 'starred' && <div>추천항목 탭</div>}

          {activeTab === 'project' && (
            <ProjectTab
              projects={mockProjects}
              selectedProjectIndex={selectedProjectIndex}
              setSelectedProjectIndex={setSelectedProjectIndex}
            />
          )}


          {activeTab === 'dashboard' && <div>추천항목 탭</div>}
          {activeTab === 'team' && <div>추천항목 탭</div>}
        </main>
      </div>
    </div>
  );
};

export default Main;
