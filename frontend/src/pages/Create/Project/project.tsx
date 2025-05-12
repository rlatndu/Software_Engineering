import React, { useState } from 'react';
import './Project.css';

const ProjectCreatePage = () => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [access, setAccess] = useState('');
  const [keyError, setKeyError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.length < 3) {
      setKeyError('key 값은 3글자 이상이어야 해요!');
      return;
    }
    setKeyError('');
    console.log({ name, key, access });
  };

  return (
    <div className="project-create-page">
      <div className="content-wrapper">
        <div className="form-wrapper">
          <h2 className="form-title">프로젝트 생성하기</h2>

          <form className="project-form" onSubmit={handleSubmit}>
  <div className="group">
    <div className="form-groups-wrapper"> {/* ✅ 추가된 div */}
      <div className="form-group">
        <label htmlFor="name">이름 *</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="프로젝트 이름을 입력해주세요"
        />
      </div>

      <div className="form-group">
        <label htmlFor="key">key *</label>
        <input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="key값 입력해주세요"
        />
      </div>

      {/*keyError && <p className="error-text">{keyError}</p>} {/* 위치 조정 가능 */}

      <div className="form-group">
        <label htmlFor="access">액세스 *</label>
        <select
          id="access"
          value={access}
          onChange={(e) => setAccess(e.target.value)}
        >
          <option value="c">액세스 수준을 선택해주세요</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>

    <div className="character-wrapper">
      <img src="/assets/icon_logo_left.png" className="character-image" alt="logo character" />
    </div>
  </div>

  <div className="form-buttons">
    <button type="button" className="cancel">취소</button>
    <button type="submit" className="submit">프로젝트 생성</button>
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

export default ProjectCreatePage;
