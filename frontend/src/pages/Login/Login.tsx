import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [id, setId] = useState("") // 아이디 입력값
  const [password,setPassword] = useState("") // 비밀번호 입력값
  const [loginError, setLoginError] = useState<string | null>(null); // 에러 메시지 상태태
  const [loading, setLoading] = useState(false);

  // 로그인 버튼 클릭 시 호출될 함수수
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if(!id.trim() || !password.trim()){
      setLoginError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
  
    if(id == "admin" && password == "0000"){
      setLoginError(null);
      console.log("로그인 성공");
      navigate("/main");
    }
    else{
      setLoginError("아이디 또는 비밀번호가 일치하지 않습니다.");
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

          <label htmlFor="id">ID</label>
          <input
            id="id"
            type="text"
            placeholder="ID를 입력하세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {loginError && <p className="error_text">{loginError}</p>}

          <div className="login_remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">로그인 유지</label>
          </div>

          <button type="submit" className="login_page_button" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="social_divider">
          <span className="line" />
          <span className="or-text">또는</span>
          <span className="line" />
        </div>

        <div className="sns_page_login">
          <button className="login_google_btn">
            <img src="/assets/icon_logo_google.png" alt="Google Logo" className="googlelogo_png" />
            <span>Google</span>
          </button>
          <button className="login_naver_btn">
            <img src="/assets/icon_logo_never.png" alt="Naver Logo" className="naverlogo_png" />
            <span>Naver</span>
          </button>
        </div>

        <div className="long_links">
          <Link to="/join">회원가입</Link> | 
          <Link to="/id_find"> 아이디 찾기</Link> | 
          <Link to="/passward_find"> 비밀번호 찾기</Link>
        </div>
      </section>
    </div>
  );
};

export default Login;
