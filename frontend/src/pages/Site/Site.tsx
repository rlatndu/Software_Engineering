import React from "react";
import { Bell, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import "./Site.css";

const Site = () => {
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

        {/* === 메인 콘텐츠 === */}
        <main className="main-content">
          {/* 내 사이트 */}
          <section className="my-site-section">
            <h2 className="section-title">내 사이트</h2>
            <div className="empty-site">
              <p>사이트가 없습니다.</p>
              <Link className="link" to="/Create/Site">사이트 만들기</Link>
              <img src="/assets/icon_logo_hing.png" alt="슬라임 캐릭터" />
            </div>
          </section>

          {/* 최근 방문 */}
          <section className="recent-visit-section">
            <h2 className="section-title">최근 방문</h2>
            <div className="empty-recent">
              <p>방문한 프로젝트가 없습니다.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Site;
