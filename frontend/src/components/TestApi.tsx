import { useState } from 'react';
import axios from 'axios';

interface ServerResponse {
  status: string;
  message: string;
}

const TestApi = () => {
  const [serverStatus, setServerStatus] = useState('');
  const [signupResult, setSignupResult] = useState('');
  const [loginResult, setLoginResult] = useState('');

  const checkServer = async () => {
    try {
      const response = await axios.get<ServerResponse>('http://localhost:8080/api/test');
      setServerStatus(response.data.message || response.data.status);
    } catch (error) {
      setServerStatus('서버 연결 실패');
    }
  };

  const testSignup = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/signup', {
        email: 'test@example.com',
        password: 'password123!',
        passwordConfirm: 'password123!',
        userId: 'testuser'
      });
      setSignupResult(JSON.stringify(response.data));
    } catch (error) {
      setSignupResult('회원가입 실패');
    }
  };

  const testLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: 'test@example.com',
        password: 'password123!'
      });
      setLoginResult(JSON.stringify(response.data));
    } catch (error) {
      setLoginResult('로그인 실패');
    }
  };

  return (
    <div>
      <h2>API 테스트</h2>
      <div>
        <button onClick={checkServer}>서버 상태 확인</button>
        <p>결과: {serverStatus}</p>
      </div>
      <div>
        <button onClick={testSignup}>회원가입 테스트</button>
        <p>결과: {signupResult}</p>
      </div>
      <div>
        <button onClick={testLogin}>로그인 테스트</button>
        <p>결과: {loginResult}</p>
      </div>
    </div>
  );
};

export default TestApi; 