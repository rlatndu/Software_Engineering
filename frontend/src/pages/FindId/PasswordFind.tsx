import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../api/authService";
import './IdFind.css';

const PasswordFind = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증코드 입력, 3: 새 비밀번호 설정
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

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

            // 비밀번호 재설정 코드 요청
            await authService.requestPasswordReset(email);
            setStep(2);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "인증 코드 발송 중 오류가 발생했습니다.";
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

            // 인증 코드 확인 - 임시로 바로 다음 단계로 진행
            setStep(3);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "인증 코드 확인 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            // 비밀번호 유효성 검사
            if (!newPassword.trim() || !newPasswordConfirm.trim()) {
                setError("새 비밀번호를 입력해주세요.");
                return;
            }

            if (newPassword !== newPasswordConfirm) {
                setError("비밀번호가 일치하지 않습니다.");
                return;
            }

            // 비밀번호 복잡도 검사
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                setError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.");
                return;
            }

            // 비밀번호 재설정
            await authService.resetPasswordWithCode({
                identifier: email,
                code: verificationCode,
                newPassword: newPassword
            });
            
            alert("비밀번호가 성공적으로 변경되었습니다.");
            navigate('/login');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleSendCode}>
                        <label htmlFor="email">이메일</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="가입 시 등록한 이메일을 입력해주세요"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isProcessing}
                        />
                        <button 
                            type="submit" 
                            className="find_page_button"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "처리 중..." : "인증 코드 받기"}
                        </button>
                    </form>
                );
            case 2:
                return (
                    <form onSubmit={handleVerifyCode}>
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
                        <button 
                            type="submit" 
                            className="find_page_button"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "처리 중..." : "확인"}
                        </button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handlePasswordReset}>
                        <label htmlFor="newPassword">새 비밀번호</label>
                        <input
                            id="newPassword"
                            type="password"
                            placeholder="새 비밀번호를 입력해주세요"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isProcessing}
                        />
                        <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
                        <input
                            id="newPasswordConfirm"
                            type="password"
                            placeholder="새 비밀번호를 다시 입력해주세요"
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            disabled={isProcessing}
                        />
                        <button 
                            type="submit" 
                            className="find_page_button"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "처리 중..." : "비밀번호 변경"}
                        </button>
                    </form>
                );
            default:
                return null;
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
                    <p>비밀번호 찾기</p>
                </div>

                {error && <p className="error_text">{error}</p>}
                {renderStep()}

                <div className="login_links">
                    <Link to="/login">로그인</Link> | 
                    <Link to="/join"> 회원가입</Link> | 
                    <Link to="/id_find"> 아이디 찾기</Link>
                </div>
            </section>
        </div>
    );
};

export default PasswordFind; 