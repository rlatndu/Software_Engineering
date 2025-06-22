import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import siteService from '../../../api/siteService';
import './site.css';

const SiteCreatePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!userStr) {
        throw new Error('로그인이 필요합니다.');
      }
      const user = JSON.parse(userStr);
      console.log('Current user:', user); // 디버깅용 로그 추가
      if (!user || !user.id) {
        throw new Error('유효하지 않은 사용자 정보입니다.');
      }

      // 입력값 검증
      if (!name.trim()) {
        setError('사이트 이름을 입력해주세요.');
        setIsProcessing(false);
        return;
      }

      // 특수문자 검증
      const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
      if (specialChars.test(name)) {
        setError('사이트 이름에 특수문자를 사용할 수 없습니다.');
        setIsProcessing(false);
        return;
      }

      // 길이 검증
      if (name.length > 30) {
        setError('사이트 이름은 30자를 초과할 수 없습니다.');
        setIsProcessing(false);
        return;
      }

      // 사이트 생성 요청 (ownerId 추가)
      const site = await siteService.createSite({ 
        name: name.trim(),
        ownerId: user.id
      });
      
      // 성공 시 사이트 목록 페이지로 이동
      navigate('/site');
    } catch (err: any) {
      console.error('사이트 생성 오류:', err);
      if (err.response?.data) {
        // 서버에서 오는 에러 메시지가 객체인 경우
        if (typeof err.response.data === 'object' && err.response.data.message) {
          setError(err.response.data.message);
        }
        // 서버에서 오는 에러 메시지가 문자열인 경우 (이전 버전 호환성)
        else if (typeof err.response.data === 'string') {
          setError(err.response.data);
        }
        else {
          setError('사이트 생성에 실패했습니다. 다시 시도해주세요.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('사이트 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/site');
  };

  return (
    <div className="site-create-page">
      <div className="content-wrapper">
        <div className="form-wrapper">
          <h2 className="form-title">사이트 생성하기</h2>
          <p className="form-description">
            사이트 이름을 작성하세요..<br />
            대부분의 사용자는 팀 또는 회사 이름으로 사용합니다.<br />
            특수문자는 사용할 수 없으며, 최대 30자까지 입력 가능합니다.
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
                    placeholder="사이트 이름을 입력해주세요"
                    disabled={isProcessing}
                    maxLength={30}
                  />
                  {error && <p className="error-text">{error}</p>}
                </div>
              </div>

              <div className="character-wrapper">
                <img src="/assets/icon_logo_left.png" className="character-image" alt="logo character" />
              </div>
            </div>

            <div className="button-group">
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isProcessing}
              >
                {isProcessing ? "생성 중..." : "사이트 생성"}
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

export default SiteCreatePage;
