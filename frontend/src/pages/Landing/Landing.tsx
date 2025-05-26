import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import authService from "../../api/authService";
import './Landing.css'; // 스타일 관리

const Landing = () => {
    const navigate = useNavigate(); // 버튼 클릭하면 해당 페이지 이동용

    const [identifier, setIdentifier] = useState(""); // 아이디 또는 이메일 입력값
    const [password, setPassword] = useState(""); // 비밀번호 입력값
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
            console.error('Landing login error:', error);
            
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
                    <form onSubmit={handleLogin}>
                        <label htmlFor="identifier">ID 또는 이메일</label><br />
                        <input
                            id="identifier"
                            type="text"
                            placeholder="ID 또는 이메일을 입력하세요"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isProcessing}
                        />
                        <br />
                        <label htmlFor="password">비밀번호</label><br />
                        <input
                            id="password"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isProcessing}
                        />

                        {error && <p className="error_text">{error}</p>}
                        
                        <div className="login_remember">
                            <input 
                                type="checkbox" 
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isProcessing}
                            />
                            <label htmlFor="remember">로그인 유지</label>
                        </div>

                        <button 
                            type="submit" 
                            className="login_button"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "처리 중..." : "Login"}
                        </button>

                        <div className="social_divider">
                            <span className="line" />
                            <span className="or-text">또는</span>
                            <span className="line" />
                        </div>

                        <div className="sns_login">
                            <button type="button" className="login_google_btn" disabled={isProcessing}>
                                <img src="/assets/icon_logo_google.png" alt="Google Logo" className="googlelogo_png" />
                                <span>Google</span>
                            </button>
                            <button type="button" className="login_naver_btn" disabled={isProcessing}>
                                <img src="/assets/icon_logo_never.png" alt="Naver Logo" className="naverlogo_png" />
                                <span>Naver</span>
                            </button>
                        </div>

                        <div className="login_links">
                            <Link to="/join">회원가입</Link> | 
                            <Link to="/id_find"> 아이디 찾기</Link> | 
                            <Link to="/password_find"> 비밀번호 찾기</Link>
                        </div>
                    </form>
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