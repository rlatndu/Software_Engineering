import axios from 'axios';

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
    };
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
    identifier: string;
    code?: string;
    newPassword?: string;
}

const BASE_URL = 'http://localhost:8080/api';

const authService = {
    signup: async (data: SignupRequest): Promise<ApiResponse> => {
        try {
            const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/signup`, data);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        } catch (error: any) {
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
            const response = await axios.post<LoginResponse>(
                `${BASE_URL}/auth/login`,
                {
                    identifier: data.identifier,
                    password: data.password,
                    rememberMe: data.rememberMe || false
                }
            );

            if (response.data.token) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');

                const storage = data.rememberMe ? localStorage : sessionStorage;
                storage.setItem('token', response.data.token);
                if (response.data.user) {
                    console.log('Login response user data:', response.data.user);
                    storage.setItem('user', JSON.stringify(response.data.user));
                }
                return {
                    success: true,
                    token: response.data.token,
                    user: response.data.user,
                    message: response.data.message || '로그인이 완료되었습니다.'
                };
            } else {
                throw new Error('토큰이 없습니다.');
            }
        } catch (error: any) {
            console.error('Login error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            if (error.response?.data?.message) {
                return {
                    success: false,
                    message: error.response.data.message
                };
            }
            
            return {
                success: false,
                message: '로그인 중 오류가 발생했습니다.'
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
        const response = await axios.post<ApiResponse>(`${BASE_URL}/auth/password/send-code`, { identifier: email });
        return response.data;
    },

    resetPassword: async (data: PasswordResetRequest): Promise<MessageResponse> => {
        const response = await axios.post<MessageResponse>(`${BASE_URL}/auth/password/reset`, data);
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
        const response = await axios.post<MessageResponse>('/api/auth/find-id/send-code', { email });
        return response.data;
    },

    verifyIdFindCode: async (email: string, code: string): Promise<IdFindResponse> => {
        const response = await axios.post<IdFindResponse>('/api/auth/find-id/verify-code', { 
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