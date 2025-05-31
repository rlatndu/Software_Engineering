import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../api/authService";
import './IdFind.css';

const IdFind = () => {
    const [email, setEmail] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [foundUserId, setFoundUserId] = useState("");

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            if (!email.trim()) {
                setError("이메일을 입력해주세요.");
                return;
            }

            // 이메일 형식 검사
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError("올바른 이메일 형식이 아닙니다.");
                return;
            }

            // 인증번호 요청
            await authService.sendIdFindEmail(email);
            setIsEmailSent(true);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "인증번호 발송 중 오류가 발생했습니다.";
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
                setError("인증번호를 입력해주세요.");
                return;
            }

            // 인증번호 검증
            const response = await authService.verifyIdFindCode(email, verificationCode);
            setIsVerified(true);
            setFoundUserId(response.userId);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "인증번호 확인 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderContent = () => {
        if (isVerified && foundUserId) {
            return (
                <div className="result-container">
                    <p className="success_text">아이디 찾기가 완료되었습니다</p>
                    <p className="found-id">회원님의 아이디는 <strong>{foundUserId}</strong> 입니다.</p>
                </div>
            );
        }

        if (isEmailSent) {
            return (
                <form onSubmit={handleVerifyCode}>
                    <p className="email_sent_info">
                        인증번호가 이메일로 발송되었습니다.<br/>
                        이메일을 확인하여 인증번호를 입력해주세요.
                    </p>
                    <input
                        type="text"
                        placeholder="인증번호를 입력해주세요"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={isProcessing}
                    />
                    <button 
                        type="submit" 
                        className="find_page_button"
                        disabled={isProcessing}
                    >
                        {isProcessing ? "처리 중..." : "인증번호 확인"}
                    </button>
                </form>
            );
        }

        return (
            <form onSubmit={handleSendCode}>
                <input
                    type="email"
                    placeholder="이메일을 입력해주세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isProcessing}
                />
                <button 
                    type="submit" 
                    className="find_page_button"
                    disabled={isProcessing}
                >
                    {isProcessing ? "처리 중..." : "인증번호 받기"}
                </button>
            </form>
        );
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

                {error && <p className="error_text">{error}</p>}
                {renderContent()}
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