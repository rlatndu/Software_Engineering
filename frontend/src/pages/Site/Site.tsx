import React, { useState } from "react";
import { Bell, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import "./Site.css";

interface Site {
  id: number;
  name: string;
}

// 테스트용 데이터
//const mockSites: Site[] = []; // 사이트 없을 때
 const mockSites: Site[] = [{ id: 1, name: "슬라임 개발팀" }, { id: 2, name: "백엔드팀" }];

const SitePage = () => {
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

          <div className="icon-group">
            <Bell className="icon" />
            <Settings className="icon" />
            <User className="icon" />
          </div>
        </header>

        {/* === 본문 === */}
        <main className="site-main-content">
          <section className="site-section">
            <h2 className="section-title">내 사이트</h2>
            {mockSites.length === 0 ? (
              <div className="empty-site">
                <p>사이트가 없습니다.</p>
                <Link to="/Create/Site" className="link">사이트 만들기</Link>
                <img src="/assets/icon_logo_hing.png" alt="슬라임 아이콘" className="empty-site-image" />
              </div>
            ) : (
              <div className="site-list">
                {mockSites.map((site) => (
                  <div key={site.id} className="site-card">
                    <div className="card-text">
                      <h3>사이트</h3>
                      <h4>{site.name}</h4>
                    </div>
                    <button className="view-button">사이트 보기</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="site-section">
            <h2 className="section-title">최근 방문</h2>
            <div className="empty-recent">
              방문한 프로젝트가 없습니다.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SitePage;
