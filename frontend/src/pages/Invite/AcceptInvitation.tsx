import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invitationService } from '../../api/invitationService';
import './AcceptInvitation.css';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const accept = async () => {
      if (!token) {
        setStatus('error');
        setMessage('유효하지 않은 초대 링크입니다.');
        return;
      }
      try {
        const msg = await invitationService.acceptByToken(token!);
        setMessage(msg || '초대를 수락했습니다.');
        setStatus('success');
      } catch (e: any) {
        setMessage(e instanceof Error ? e.message : '초대 수락에 실패했습니다.');
        setStatus('error');
      }
    };
    accept();
  }, [token]);

  const closeWindow = () => {
    window.close();
  };

  return (
    <div className="invite-result-wrapper">
      {status === 'loading' && <p>초대 수락 중...</p>}
      {status !== 'loading' && (
        <div className="invite-result-box">
          <p>{message}</p>
          <button onClick={closeWindow}>창 닫기</button>
        </div>
      )}
    </div>
  );
};

export default AcceptInvitation; 