import React, { useState } from 'react';
import './site.css';

const SiteCreatePage = () => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name });
  };

  return (
    <div className="project-create-page">
      <div className="content-wrapper">
        <div className="form-wrapper">
          <h2 className="form-title">사이트 생성하기</h2>
          <p className="form-description">
            사이트 이름을 작성하세요. 사이트 이름은 Slime의 URL의 일부입니다.<br />
            대부분의 사용자는 팀 또는 회사 이름으로 사용합니다.
          </p>

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
                  />
                </div>
              </div>

              <div className="character-wrapper">
                <img src="/assets/icon_logo_left.png" className="character-image" alt="logo character" />
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" className="cancel">취소</button>
              <button type="submit" className="submit">사이트 생성</button>
            </div>
          </form>
        </div>
      </div>

      {/* 배경 쉐이프 이미지 */}
      <div className="shapes">
        <img src="/assets/shapes_darkblue.png" className="shapes1" />
        <img src="/assets/shapes_blue.png" className="shapes2" />
        <img src="/assets/shapes_sky.png" className="shapes3" />
      </div>
    </div>
  );
};

export default SiteCreatePage;
