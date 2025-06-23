import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invitationService } from '../../api/invitationService';
import './AcceptInvitation.css';

const RejectInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reject = async () => {
      if (!token) {
        setStatus('error');
        setMessage('유효하지 않은 초대 링크입니다.');
        return;
      }
      try {
        const msg = await invitationService.rejectByToken(token!);
        setMessage(msg || '초대를 거절했습니다.');
        setStatus('success');
      } catch (e: any) {
        setMessage(e instanceof Error ? e.message : '초대 거절에 실패했습니다.');
        setStatus('error');
      }
    };
    reject();
  }, [token]);

  const closeWindow = () => {
    window.close();
  };

  return (
    <div className="invite-result-wrapper">
      {status === 'loading' && <p>초대 거절 중...</p>}
      {status !== 'loading' && (
        <div className="invite-result-box">
          <p>{message}</p>
          <button onClick={closeWindow}>창 닫기</button>
        </div>
      )}
    </div>
  );
};

export default RejectInvitation; 