import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../api/authService";
import './IdFind.css';

const PasswordFind = () => {
    const [email, setEmail] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");
        setSuccessMessage("");

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
            await authService.sendPasswordResetEmail(email);
            setIsEmailSent(true);
            setSuccessMessage("인증번호가 이메일로 발송되었습니다.");
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
        setSuccessMessage("");

        try {
            if (!verificationCode.trim()) {
                setError("인증번호를 입력해주세요.");
                return;
            }

            const response = await authService.verifyPasswordResetCode(email, verificationCode);
            if (response.verified) {
                setIsVerified(true);
                setSuccessMessage("인증이 완료되었습니다. 새 비밀번호를 설정해주세요.");
            } else {
                setError("인증번호가 일치하지 않습니다.");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "인증번호 확인 중 오류가 발생했습니다.";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");
        setSuccessMessage("");

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
                email: email,
                code: verificationCode,
                newPassword: newPassword
            });
            
            setSuccessMessage("비밀번호가 성공적으로 변경되었습니다.");
            // 3초 후 입력 필드 초기화
            setTimeout(() => {
                setIsEmailSent(false);
                setIsVerified(false);
                setVerificationCode("");
                setEmail("");
                setNewPassword("");
                setNewPasswordConfirm("");
                setSuccessMessage("");
            }, 3000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.";
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
                    <p>비밀번호 찾기</p>
                </div>

                {error && <p className="error_text">{error}</p>}
                {successMessage && <p className="success_text">{successMessage}</p>}

                {!isEmailSent && (
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
                )}

                {isEmailSent && !isVerified && (
                    <form onSubmit={handleVerifyCode}>
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
                            {isProcessing ? "확인 중..." : "인증번호 확인"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isProcessing}
                            className="find_page_button resend-button"
                        >
                            인증번호 재발송
                        </button>
                    </form>
                )}

                {isVerified && (
                    <form onSubmit={handlePasswordReset}>
                        <div className="password-reset-form">
                            <input
                                type="password"
                                placeholder="새 비밀번호를 입력해주세요"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isProcessing}
                            />
                            <input
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
                                {isProcessing ? "변경 중..." : "비밀번호 변경"}
                            </button>
                        </div>
                    </form>
                )}

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