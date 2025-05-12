import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Join.css'; // 기존 스타일 재사용

const Join = () => {
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  const [idError, setIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmValid, setConfirmValid] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;

    // ID 유효성 검사
    if (!id.trim()) {
      setIdError("중복된 ID입니다.");
      isValid = false;
    } else {
      setIdError("");
    }

    // 비밀번호 유효성 검사
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setPasswordError("8자 이상, 영문+숫자를 포함해야 합니다");
      isValid = false;
    } else {
      setPasswordError("");
    }

    // 비밀번호 확인 검사
    setConfirmValid(password === confirmPassword);

    if (!isValid || password !== confirmPassword) return;

    // 회원가입 로직
    console.log("가입 정보:", { id, password, email });
    navigate("/login");
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
        <form onSubmit={handleJoin}>
          <div className="slime_text">
            <h1 className="slime">
              <span className="logo_page_text">s</span>lime
            </h1>
            <p>Join</p>
          </div>

          <label htmlFor="id">ID*</label>
          <input
            id="id"
            type="text"
            placeholder="ID를 입력하세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          {idError && <p className="error_text">{idError}</p>}

          <label htmlFor="password">password*</label>
          <input
            id="password"
            type="password"
            placeholder="password를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError && <p className="error_text">{passwordError}</p>}

          <input
            type="password"
            placeholder="password 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmValid && <span style={{ color: "green" }}>✔</span>}

          <label htmlFor="email">E-mail*</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="email"
              type="email"
              placeholder="e-mail을 입력해주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="button" className="verify_btn">인증 받기</button>
          </div>

          <button type="submit" className="login_page_button">Join</button>
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
          <p>이미 계정이 있으신가요? | <Link to="/login">로그인</Link></p>
        </div>
      </section>
    </div>
  );
};

export default Join;