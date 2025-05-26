import axios from './axios';

export interface SiteMember {
    id: number;
    email: string;
    userId: string;
    role: string;
}

export interface Site {
    id: number;
    name: string;
    owner: {
        id: number;
        email: string;
        userId: string;
    };
    members: SiteMember[];
    createdAt: string;
}

export interface CreateSiteRequest {
    name: string;
    ownerId: number;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

const BASE_URL = 'http://localhost:8080/api';

// 로컬 스토리지에서 사용자 정보 가져오기
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        console.log('Stored user data:', user); // 디버깅용 로그
        if (!user || !user.id) {
            console.error('Invalid user data in storage:', user);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

const siteService = {
    // 내 사이트 목록 조회
    getMySites: async (): Promise<Site[]> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        }
        try {
            const response = await axios.get<ApiResponse<Site[]>>(`${BASE_URL}/sites/my`);
            console.log('Sites API Response:', response.data); // 디버깅용 로그
            
            if (!response.data.success) {
                throw new Error(response.data.message || '사이트 목록을 불러오는데 실패했습니다.');
            }
            
            return response.data.data || [];
        } catch (error: any) {
            console.error('Error fetching sites:', error);
            if (error.response?.status === 403) {
                throw new Error('권한이 없습니다.');
            } else if (error.response?.status === 401) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error('사이트 목록을 불러오는데 실패했습니다.');
            }
        }
    },

    // 최근 방문한 사이트 목록 조회 (임시로 빈 배열 반환)
    getRecentSites: async (): Promise<Site[]> => {
        return [];
    },

    // 사이트 생성
    createSite: async (data: CreateSiteRequest): Promise<Site> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        }
        try {
            const response = await axios.post<ApiResponse<Site>>(`${BASE_URL}/sites`, {
                ...data,
                ownerId: user.id
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '사이트 생성에 실패했습니다.');
            }
            
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw new Error(error.response?.data?.message || '사이트 생성에 실패했습니다.');
        }
    },

    // 사이트 상세 정보 조회
    getSiteById: async (siteId: number): Promise<Site> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        }
        try {
            const response = await axios.get<ApiResponse<Site>>(`${BASE_URL}/sites/${siteId}`);
            
            if (!response.data.success) {
                throw new Error(response.data.message || '사이트 정보를 불러오는데 실패했습니다.');
            }
            
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw new Error(error.response?.data?.message || '사이트 정보를 불러오는데 실패했습니다.');
        }
    },

    // 사이트 삭제
    deleteSite: async (siteId: number): Promise<void> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        }
        try {
            const response = await axios.delete<ApiResponse<void>>(`${BASE_URL}/sites/${siteId}`);
            
            if (!response.data.success) {
                throw new Error(response.data.message || '사이트 삭제에 실패했습니다.');
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw new Error(error.response?.data?.message || '사이트 삭제에 실패했습니다.');
        }
    }
};

export default siteService; 