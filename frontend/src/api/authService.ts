import axios from 'axios';
import { UserRole } from '../types/role';

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    verified?: boolean;
}

interface LoginResponse extends ApiResponse {
    token?: string;
    user?: {
        id: number;
        email: string;
        userId: string;
        siteRoles: { [key: number]: string };  // key: siteId, value: role
    };
    message?: string;
}

interface SignupRequest {
    email: string;
    password: string;
    passwordConfirm: string;
    userId: string;
}

interface LoginRequest {
    identifier: string;
    password: string;
    rememberMe?: boolean;
}

interface IdFindResponse {
    userId: string;
    message: string;
}

interface MessageResponse {
    message: string;
}

interface PasswordResetRequest {
    email: string;
    code: string;
    newPassword: string;
}

const BASE_URL = 'http://localhost:8081/api';

// axios 기본 설정
axios.defaults.withCredentials = true;

const authService = {
    signup: async (data: SignupRequest): Promise<ApiResponse> => {
        try {
            const response = await axios.post<ApiResponse>(
                `${BASE_URL}/auth/signup`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    withCredentials: true
                }
            );
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Signup error:', error.response?.data || error);
            return {
                success: false,
                message: error.response?.data?.message || "회원가입에 실패했습니다."
            };
        }
    },

    sendVerificationEmail: async (email: string): Promise<ApiResponse> => {
        try {
            const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/verify/send`, { email });
            return {
                success: true,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || "이메일 발송에 실패했습니다."
            };
        }
    },

    verifyEmail: async (token: string): Promise<ApiResponse> => {
        try {
            console.log('Making API request to:', `${BASE_URL}/auth/verify`);
            const response = await axios.post<{message: string; success: boolean}>(`${BASE_URL}/auth/verify`, { token });
            console.log('API response:', response.data);
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error: any) {
            console.error('API error:', error.response || error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || "이메일 인증에 실패했습니다."
            };
        }
    },

    login: async (data: LoginRequest): Promise<LoginResponse> => {
        try {
            console.log('Login request:', { identifier: data.identifier, rememberMe: data.rememberMe });
            
            const response = await axios.post<LoginResponse>(
                `${BASE_URL}/auth/login`,
                {
                    identifier: data.identifier,
                    password: data.password,
                    rememberMe: data.rememberMe || false
                }
            );

            console.log('Login response:', {
                success: true,
                hasToken: !!response.data.token,
                hasUser: !!response.data.user
            });

            if (!response.data.token) {
                throw new Error('서버에서 토큰을 받지 못했습니다.');
            }

            // 기존 데이터 초기화
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');

            // 새로운 데이터 저장
            const storage = data.rememberMe ? localStorage : sessionStorage;
            
            // 토큰 저장 및 설정
            storage.setItem('token', response.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            console.log('Token stored in storage:', storage.getItem('token'));
            console.log('Token set in axios headers:', axios.defaults.headers.common['Authorization']);

            if (response.data.user) {
                const userWithEnumRole = {
                    ...response.data.user,
                    id: response.data.user.id,
                    userId: response.data.user.userId,
                    name: response.data.user.userId,
                    roles: {
                        siteRole: response.data.user.siteRoles ? Object.values(response.data.user.siteRoles)[0] : undefined,
                        projectRoles: {}
                    }
                };
                console.log('Storing user data:', userWithEnumRole);
                storage.setItem('user', JSON.stringify(userWithEnumRole));

                // 로그인 성공 후 사이트 페이지로 이동
                window.location.href = '/site';

                return {
                    success: true,
                    token: response.data.token,
                    user: userWithEnumRole,
                    message: response.data.message || '로그인이 완료되었습니다.'
                };
            }

            throw new Error('사용자 정보를 받지 못했습니다.');
        } catch (error: any) {
            console.error('Login error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            // 에러 발생 시 인증 정보 초기화
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || '로그인 중 오류가 발생했습니다.'
            };
        }
    },

    logout: async (): Promise<ApiResponse> => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/logout`);
        return response.data;
    },

    checkUserIdDuplicate: async (userId: string): Promise<boolean> => {
        const response = await axios.post<boolean>(`${BASE_URL}/auth/check-userid`, { userId });
        return response.data;
    },

    findUserId: async (email: string): Promise<ApiResponse> => {
        const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/find-userid`, { email });
        return response.data;
    },

    requestPasswordReset: async (email: string): Promise<ApiResponse> => {
        const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/password/send`, { email });
        return response.data;
    },

    verifyToken: async (): Promise<{ isValid: boolean }> => {
        try {
            const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/verify-token`);
            return { isValid: response.data.success || false };
        } catch (error) {
            console.error('Token verification failed:', error);
            return { isValid: false };
        }
    },

    resetPassword: async (data: PasswordResetRequest): Promise<MessageResponse> => {
        const response = await axios.post<MessageResponse>(`${BASE_URL}/auth/password/reset`, {
            email: data.email,
            token: data.code,
            newPassword: data.newPassword
        });
        return response.data;
    },

    checkEmailVerification: async (email: string): Promise<ApiResponse> => {
        try {
            const response = await axios.get<ApiResponse>(`${BASE_URL}/auth/verify/check`, {
                params: { email }
            });
            return {
                success: true,
                verified: response.data.verified,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                verified: false,
                message: error.response?.data?.message || "인증 상태 확인에 실패했습니다."
            };
        }
    },

    resetPasswordWithToken: async (token: string, newPassword: string): Promise<ApiResponse> => {
        const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/reset-password`, { 
            token, 
            newPassword 
        });
        return response.data;
    },

    sendIdFindEmail: async (email: string): Promise<MessageResponse> => {
        const response = await axios.post<MessageResponse>(`${BASE_URL}/auth/find-id/send`, { email });
        return response.data;
    },

    verifyIdFindCode: async (email: string, code: string): Promise<IdFindResponse> => {
        const response = await axios.post<IdFindResponse>(`${BASE_URL}/auth/find-id/verify`, { 
            email, 
            code 
        });
        return response.data;
    },

    sendPasswordResetEmail: async (email: string): Promise<MessageResponse> => {
        const response = await axios.post<MessageResponse>(`${BASE_URL}/auth/password/send`, { email });
        return response.data;
    },

    verifyPasswordResetCode: async (email: string, code: string): Promise<ApiResponse<any>> => {
        const response = await axios.post<ApiResponse<any>>(`${BASE_URL}/auth/password/verify`, { 
            email, 
            code 
        });
        return response.data;
    },

    resetPasswordWithCode: async (data: PasswordResetRequest): Promise<MessageResponse> => {
        const response = await axios.post<MessageResponse>(`${BASE_URL}/auth/password/reset`, data);
        return response.data;
    }
};

export const getToken = (): string | null => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token;
};

export default authService; 