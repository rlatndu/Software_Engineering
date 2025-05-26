import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../api/authService";
import './Join.css'; // 기존 스타일 재사용

const Join = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  const [idError, setIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState<React.ReactNode>("");
  const [confirmValid, setConfirmValid] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ID 입력 필드 비활성화 상태 관리
  const [idFieldDisabled, setIdFieldDisabled] = useState(true);
  // 비밀번호 입력 필드 비활성화 상태 관리
  const [passwordFieldDisabled, setPasswordFieldDisabled] = useState(true);

  // 이메일 인증 토큰 확인
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      checkEmailVerification(token);
    }
  }, [location]);

  // 이메일 인증 메시지 수신 처리
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EMAIL_VERIFIED' && event.data.verified) {
        setEmailVerified(true);
        setVerificationSent(true);
        setEmailError("이메일 인증이 완료되었습니다.");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // 라우터 상태에서 이메일 인증 상태 확인
    if (location.state?.emailVerified) {
        setEmailVerified(true);
        setVerificationSent(true);
        setEmailError("이메일 인증이 완료되었습니다.");
        // 인증된 이메일 주소 설정
        if (location.state?.verifiedEmail) {
            setEmail(location.state.verifiedEmail);
        }
    }
  }, [location]);

  const checkEmailVerification = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      if (response.success) {
        setEmailVerified(true);
        setVerificationSent(true);
        setEmailError("이메일 인증이 완료되었습니다.");
      }
    } catch (error: any) {
      setEmailError("이메일 인증에 실패했습니다.");
      setEmailVerified(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setIsProcessing(true);
      if (!email) {
        setEmailError("이메일을 입력해주세요.");
        return;
      }
      
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        setEmailError("올바른 이메일 형식이 아닙니다.");
        return;
      }

      const response = await authService.sendVerificationEmail(email);
      
      if (response.success) {
        setVerificationSent(true);
        // 이미 인증된 이메일인 경우
        if (response.message?.includes("이미 인증이 완료된 이메일입니다")) {
          setEmailVerified(true);
          setEmailError(response.message);
        } else {
          setEmailError("인증 메일이 발송되었습니다. 이메일을 확인해주세요.");
          // 이메일 인증 상태를 주기적으로 확인
          const checkVerificationStatus = async () => {
            try {
              const verificationStatus = await authService.checkEmailVerification(email);
              if (verificationStatus.verified) {
                setEmailVerified(true);
                setEmailError("이메일 인증이 완료되었습니다.");
                return true;
              }
              return false;
            } catch (error) {
              console.error("인증 상태 확인 중 오류:", error);
              return false;
            }
          };

          // 10초마다 인증 상태 확인 (최대 5분)
          let attempts = 0;
          const maxAttempts = 30; // 5분 = 30 * 10초
          const interval = setInterval(async () => {
            attempts++;
            const isVerified = await checkVerificationStatus();
            if (isVerified || attempts >= maxAttempts) {
              clearInterval(interval);
            }
          }, 10000);
        }
      } else {
        setEmailError(response.message || "이메일 인증 요청 중 오류가 발생했습니다.");
        setVerificationSent(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "서버와의 통신 중 오류가 발생했습니다.";
      setEmailError(errorMessage);
      setVerificationSent(false);
      
      // 이미 가입된 이메일인 경우 로그인 링크 표시
      if (errorMessage.includes("이미 가입된 이메일입니다")) {
          setEmailError(
              <span>
                  {errorMessage}{" "}
                  <Link to="/login" className="login-link">
                      로그인하기
                  </Link>
              </span>
          );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (!validatePassword(newPassword)) {
      setPasswordError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.");
    } else {
      setPasswordError("");
    }
    
    if (confirmPassword) {
      setConfirmValid(newPassword === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setConfirmValid(password === newConfirmPassword);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;

    try {
      setIsProcessing(true);

      if (!emailVerified) {
        setEmailError("이메일 인증을 완료해주세요.");
        isValid = false;
      }

      if (!id.trim()) {
        setIdError("ID를 입력해주세요.");
        isValid = false;
      }

      if (!validatePassword(password)) {
        setPasswordError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.");
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmValid(false);
        isValid = false;
      }

      if (!isValid) return;

      const signupResponse = await authService.signup({
        email,
        password,
        passwordConfirm: confirmPassword,
        userId: id
      });

      if (signupResponse.success) {
        navigate('/login', { state: { message: "회원가입이 완료되었습니다. 로그인해주세요." } });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.includes('이메일')) {
        setEmailError(errorMessage);
      } else if (errorMessage?.includes('비밀번호')) {
        setPasswordError(errorMessage);
      } else if (errorMessage?.includes('ID')) {
        setIdError(errorMessage);
      } else {
        setEmailError("회원가입 중 오류가 발생했습니다.");
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
        <form onSubmit={handleJoin}>
          <div className="slime_text">
            <h1 className="slime">
              <span className="logo_page_text">s</span>lime
            </h1>
            <p>Join</p>
          </div>

          <label htmlFor="email">E-mail*</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="email"
              type="email"
              placeholder="e-mail을 입력해주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={verificationSent || isProcessing}
            />
            <button 
              type="button" 
              className="verify_btn" 
              onClick={handleVerifyEmail}
              disabled={verificationSent || isProcessing}
            >
              {isProcessing ? "처리 중..." : verificationSent ? "인증 완료" : "인증 받기"}
            </button>
          </div>
          {emailError && (
            <p className={verificationSent ? "success_text" : "error_text"}>
              {emailError}
            </p>
          )}

          <label htmlFor="id">ID*</label>
          <input
            id="id"
            type="text"
            placeholder="ID를 입력하세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={!emailVerified}
          />
          {idError && <p className="error_text">{idError}</p>}

          <label htmlFor="password">password*</label>
          <input
            id="password"
            type="password"
            placeholder="password를 입력해주세요"
            value={password}
            onChange={handlePasswordChange}
            disabled={!emailVerified}
          />
          {passwordError && <p className="error_text">{passwordError}</p>}

          <input
            type="password"
            placeholder="password 재입력"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={!emailVerified}
          />
          {!confirmValid && confirmPassword && 
            <p className="error_text">비밀번호가 일치하지 않습니다.</p>}

          <button 
            type="submit" 
            className="login_page_button"
            disabled={!emailVerified}
          >
            {isProcessing ? "처리 중..." : "Join"}
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
          <p>이미 계정이 있으신가요? | <Link to="/login">로그인</Link></p>
        </div>
      </section>
    </div>
  );
};

export default Join;