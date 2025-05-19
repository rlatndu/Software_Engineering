import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import './Landing.css'; // 스타일 관리

const Landing = () => {
    const navigate = useNavigate(); // 버튼 클릭하면 해당 페이지 이동용

    const [id, setId] = useState("") // 아이디 입력값
    const [password,setPassword] = useState("") // 비밀번호 입력값
    const [loginError, setLoginError] = useState<string | null>(null); // 에러 메시지 상태태

    const handleJoin = () => {
        if(!id.trim() || !password.trim()){
            setLoginError("아이디와 비밀번호를 모두 입력해주세요.");
        }
        else{
            setLoginError(null);
            navigate("/site");
        }
    }

    return (
        <div className="landing_container">
           <header className="landing_header">
                <div className="logo_section_wrapper">
                    <div className="logo_section">
                    <h1>
                        <img src="/assets/icon_logo.png" alt="Slime Logo" className="logo_img" />
                        s<span className="logo_text">lime</span>
                    </h1>
                    </div>
                </div>
                <div className="auth_button">
                    <button className="login_button" onClick={() => navigate('/login')}>로그인</button>
                    <button className="join_button" onClick={() => navigate('/join')}>회원가입</button>
                </div>
            </header>
            <main className="landing_main">
                <section className="landing_text">
                    <h1>
                        복잡한 협업을 부드럽게<br />
                        <span className="highlight">S</span>lime과 함께하세요.
                    </h1>
                    <p>작업을 계획하고, 협업하고, 추적할 수 있는<br />
                        올인원 협업 플랫폼입니다.</p>
                </section>

                <section className="landing_login">
                    <label htmlFor="id">ID</label><br />
                    <input
                        id="id"
                        type="text"
                        placeholder="ID를 입력하세요"
                        value={id}
                        onChange={(e) => setId(e.target.value)}/>
                    <br />
                    <label htmlFor="password">PASSWARD</label><br />
                    <input
                        id="password"
                        type="password"
                        placeholder="passward를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}/>

                    {loginError && <p className="error_text">{loginError}</p>}
                    
                    <div className="login_remember">
                        <input type="checkbox" id="remember"/>
                        <label htmlFor="remember">로그인 유지</label>
                    </div>

                    <button className="login_button" onClick={handleJoin}>Login</button>

                    <div className="social_divider">
                        <span className="line" />
                        <span className="or-text">또는</span>
                        <span className="line" />
                    </div>

                    <div className="sns_login">
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
                        <Link to="/id_find"> 아이디 찾기</   Link> | 
                        <Link to="/passward_find"> 비밀번호 찾기</Link>
                    </div>
                </section>
            </main>

            <section className="landing_cards">
                <div className="card"></div>
                    <div className="card"></div>
                    <div className="card"></div>
            </section>
        </div>
    );
}

export default Landing;