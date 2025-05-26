import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export interface SignupData {
    email: string;
    password: string;
    passwordConfirm: string;
    userId: string;
}

export const authService = {
    // 이메일 인증 요청
    sendVerificationEmail: async (email: string) => {
        const response = await axios.post(`${API_URL}/verify/send`, { email });
        return response.data;
    },

    // 이메일 인증 확인
    verifyEmail: async (token: string) => {
        const response = await axios.get(`${API_URL}/verify?token=${token}`);
        return response.data;
    },

    // 회원가입
    signup: async (data: SignupData) => {
        const response = await axios.post(`${API_URL}/signup`, data);
        return response.data;
    }
}; 