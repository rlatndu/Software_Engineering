import axios from 'axios';

// 기본 axios 설정
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 60초로 증가

// 초기 토큰 설정
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 요청 인터셉터
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('Request interceptor - token exists:', !!token);
        
        if (token) {
            if (!config.headers) {
                config.headers = {};
            }
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request interceptor - set Authorization header:', config.headers.Authorization);
        } else {
            console.log('Request interceptor - no token found');
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        console.error('Response interceptor error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // 타임아웃 에러 처리
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            const config = error.config;
            
            // 재시도 횟수 확인
            config.retryCount = config.retryCount || 0;
            
            // 최대 2번까지 재시도
            if (config.retryCount < 2) {
                config.retryCount += 1;
                console.log(`Retrying request (${config.retryCount}/2)...`);
                return axios(config);
            }
        }

        // 401 에러 처리
        if (error.response?.status === 401) {
            console.log('Unauthorized error detected, clearing auth data');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/login';  // 로그인 페이지로 리다이렉트
        }

        return Promise.reject(error);
    }
);

export default axios; 