import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../api/authService';
import './Verify.css';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState('이메일 인증을 처리중입니다...');
    const [verifiedEmail, setVerifiedEmail] = useState<string>('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            console.log('Verifying token:', token);

            if (!token) {
                setVerificationStatus('error');
                setMessage('유효하지 않은 인증 링크입니다.');
                return;
            }

            try {
                console.log('Sending verification request...');
                const response = await authService.verifyEmail(token);
                console.log('Verification response:', response);

                if (response.success) {
                    setVerificationStatus('success');
                    setMessage('이메일 인증이 완료되었습니다. 회원가입 페이지로 돌아가서 나머지 정보를 입력해주세요.');
                    setVerifiedEmail(response.data?.email || '');
                } else {
                    setVerificationStatus('error');
                    setMessage(response.message || '이메일 인증에 실패했습니다.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setVerificationStatus('error');
                setMessage('이메일 인증 처리 중 오류가 발생했습니다.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="verify-container">
            <div className={`verify-box ${verificationStatus}`}>
                <h2>이메일 인증</h2>
                <p>{message}</p>
                {verifiedEmail && (
                    <p className="verified-email">인증된 이메일: {verifiedEmail}</p>
                )}
                <button 
                    onClick={() => window.close()} 
                    className="close-button"
                >
                    창 닫기
                    </button>
            </div>
        </div>
    );
};

export default Verify; 