import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../api/authService";
import './IdFind.css';

const IdFind = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [foundId, setFoundId] = useState("");

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            if (!email.trim()) {
                setError("이메일을 입력해주세요.");
                return;
            }

            await authService.sendIdFindEmail(email);
            setIsEmailSent(true);
        } catch (error: any) {
            const errorMessage = error.response?.data || "이메일 전송 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            if (!verificationCode.trim()) {
                setError("인증 코드를 입력해주세요.");
                return;
            }

            const response = await authService.verifyIdFindCode(email, verificationCode);
            if (response.userId) {
                setFoundId(response.userId);
            } else {
                throw new Error("아이디를 찾을 수 없습니다.");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data || "인증 코드 확인 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="find_container">
            <div className="shapes">
                <div className="shapes_top">
                    <img src="/assets/shapes_blue.png" alt="shapes blue" className="shapes1" />
                </div>
                <div className="shapes_right">
                    <img src="/assets/shapes_sky.png" alt="shapes sky" className="shapes2" />
                </div>
                <div className="shapes_left">
                    <img src="/assets/shapes_darkblue.png" alt="shapes darkblue" className="shapes3" />
                </div>
            </div>

            <section className="find_box">
                <div className="slime_text">
                    <h1 className="slime">
                        <span className="logo_page_text">s</span>lime
                    </h1>
                    <p>아이디 찾기</p>
                </div>

                {!foundId ? (
                    <form onSubmit={isEmailSent ? handleVerifyCode : handleSendEmail}>
                        {!isEmailSent ? (
                            <>
                                <label htmlFor="email">이메일</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="가입 시 등록한 이메일을 입력해주세요"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </>
                        ) : (
                            <>
                                <p className="email_sent_info">
                                    입력하신 이메일로 인증 코드를 발송했습니다.<br />
                                    이메일을 확인해주세요.
                                </p>
                                <label htmlFor="verificationCode">인증 코드</label>
                                <input
                                    id="verificationCode"
                                    type="text"
                                    placeholder="인증 코드 6자리를 입력해주세요"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </>
                        )}

                        {error && <p className="error_text">{error}</p>}

                        <button 
                            type="submit" 
                            className="find_page_button"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "처리 중..." : (isEmailSent ? "확인" : "인증 코드 받기")}
                        </button>
                    </form>
                ) : (
                    <div className="found_id_container">
                        <p className="found_id_text">
                            찾으신 아이디는<br />
                            <strong>{foundId}</strong><br />
                            입니다.
                        </p>
                        <button 
                            className="find_page_button"
                            onClick={() => navigate('/login')}
                        >
                            로그인하기
                        </button>
                    </div>
                )}

                <div className="login_links">
                    <Link to="/login">로그인</Link> | 
                    <Link to="/join"> 회원가입</Link> | 
                    <Link to="/password_find"> 비밀번호 찾기</Link>
                </div>
            </section>
        </div>
    );
};

export default IdFind; 