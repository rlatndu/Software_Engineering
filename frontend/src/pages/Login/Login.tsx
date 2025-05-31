import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../api/authService";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/role";
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      // 클라이언트 측 유효성 검사
      if (!identifier.trim()) {
        setError("아이디 또는 이메일을 입력해주세요.");
        setIsProcessing(false);
        return;
      }

      if (!password.trim()) {
        setError("비밀번호를 입력해주세요.");
        setIsProcessing(false);
        return;
      }

      const response = await authService.login({
        identifier,
        password,
        rememberMe
      });

      // 로그인 성공 여부 확인
      if (response.success && response.token && response.user) {
        console.log('로그인 성공, 사이트 목록 페이지로 이동');
        
        // AuthContext 업데이트
        const userWithRoles = {
          ...response.user,
          name: response.user.userId,
          roles: {
            siteRole: response.user.siteRoles ? 
              (Object.values(response.user.siteRoles)[0] === 'ADMIN' ? UserRole.ADMIN :
               Object.values(response.user.siteRoles)[0] === 'PM' ? UserRole.PM :
               UserRole.MEMBER) : undefined,
            projectRoles: {}
          }
        };
        login(userWithRoles);

        // 이전 페이지가 있으면 해당 페이지로, 없으면 사이트 목록 페이지로 이동
        const from = location.state?.from || '/site';
        navigate(from, { replace: true });
      } else {
        // 토큰이나 사용자 정보가 없는 경우
        throw new Error(response.message || "로그인 응답이 올바르지 않습니다.");
      }
    } catch (error: any) {
      console.error('로그인 에러:', error);
      setError(error.message || "로그인에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="login_container">
      <div className="shapes">
        <div className="shapes_top">
          <img src="assets/shapes_blue.png" alt="shapes blue" className="shapes1" />
        </div>
        <div className="shapes_right">
          <img src="assets/shapes_sky.png" alt="shapes sky" className="shapes2" />
        </div>
        <div className="shapes_left">
          <img src="assets/shapes_darkblue.png" alt="shapes darkblue" className="shapes3" />
        </div>
      </div>

      <section className="login_box">
        <form onSubmit={handleLogin}>
          <div className="slime_text">
            <h1 className="slime">
              <span className="logo_page_text">s</span>lime
            </h1>
            <p>Login</p>
          </div>

          <label htmlFor="identifier">ID</label>
          <input
            id="identifier"
            type="text"
            placeholder="ID 또는 이메일을 입력해주세요"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isProcessing}
          />

          <label htmlFor="password">password</label>
          <input
            id="password"
            type="password"
            placeholder="password를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isProcessing}
          />

          <div className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">로그인 유지</label>
          </div>

          {error && <p className="error_text">{error}</p>}

          <button 
            type="submit" 
            className="login_page_button"
            disabled={isProcessing}
          >
            {isProcessing ? "처리 중..." : "Login"}
          </button>
        </form>

        <div className="social_divider">
          <span className="line" />
          <span className="or-text">또는</span>
          <span className="line" />
        </div>

        <div className="sns_page_login">
          <button className="login_google_btn" disabled={isProcessing}>
            <img src="/assets/icon_logo_google.png" alt="Google Logo" className="googlelogo_png" />
            <span>Google</span>
          </button>
          <button className="login_naver_btn" disabled={isProcessing}>
            <img src="/assets/icon_logo_never.png" alt="Naver Logo" className="naverlogo_png" />
            <span>Naver</span>
          </button>
        </div>

        <div className="login_links">
          <Link to="/join">회원가입</Link> | 
          <Link to="/id_find"> 아이디 찾기</Link> | 
          <Link to="/password_find"> 비밀번호 찾기</Link>
        </div>
      </section>
    </div>
  );
};

export default Login;
