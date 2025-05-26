import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../api/authService";
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
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
      if (response && response.token) {
        // 로그인 성공 시 사이트 목록 페이지로 이동
        navigate('/site');
      } else {
        // 토큰이 없는 경우
        throw new Error("로그인 응답이 올바르지 않습니다.");
      }
      
    } catch (error: any) {
      console.error('Login component error:', error);
      
      // 서버로부터 받은 에러 메시지 처리
      const errorMessage = error.response?.data || error.message;
      
      // 특정 에러 메시지에 따른 사용자 친화적인 메시지 설정
      if (errorMessage.includes("이메일 인증이 필요합니다")) {
        setError("이메일 인증이 필요합니다. 회원가입 시 받은 인증 메일을 확인해주세요.");
      } 
      else if (errorMessage.includes("비밀번호를 잘못 입력했습니다") || errorMessage.includes("올바르지 않습니다")) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
      else if (errorMessage.includes("등록되지 않은 아이디")) {
        setError("등록되지 않은 아이디입니다. 회원가입 후 이용해주세요.");
      }
      else {
        setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
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
