import axios from 'axios';
import { ApiResponse } from '../types/api';
import { UserRole } from '../types/role';
import type { Project, CreateProjectRequest, ProjectMember as BackendProjectMember } from '../types/project';

// UI에서 사용하는 간단한 프로젝트 멤버 정보
export interface ProjectMember {
    userId: string;
    name: string;
    role: string;
}

export interface UpdateIssueOrderRequest {
    issueId: number;
    newOrder: number;
}

export interface RecentWork {
    id: number;
    description: string;
    projectName: string;
    updatedAt: string;
}

export interface UnresolvedIssue {
    id: number;
    title: string;
    projectName: string;
    priority: string;
    dueDate: string;
}

export interface SiteMemberRoleResponse extends ApiResponse<{ role: UserRole }> {}

// axios 인스턴스 생성
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
    timeout: 30000, // 30초
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// 응답 인터셉터 추가
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'));
        }
        return Promise.reject(error);
    }
);

export const projectService = {
    // 사이트 멤버 역할 조회
    getSiteMemberRole: async (siteId: number, userId: string): Promise<string | null> => {
        try {
            const response = await axiosInstance.get<{ success: boolean; role: string }>(`/sites/${siteId}/members/${userId}/check-role`);
            console.log('Role check response:', response.data); // 디버깅용 로그
            return response.data.role || null;
        } catch (error: any) {
            console.error('사이트 멤버 역할 조회 에러:', error);
            throw new Error(error.message || '사이트 멤버 역할을 확인할 수 없습니다.');
        }
    },

    // 프로젝트 생성
    createProject: async (data: CreateProjectRequest): Promise<Project> => {
        try {
            const response = await axiosInstance.post<ApiResponse<Project>>('/projects', data);
            if (!response.data.success) {
                throw new Error(response.data.message || '프로젝트 생성에 실패했습니다.');
            }
            return response.data.data;
        } catch (error: any) {
            console.error('프로젝트 생성 에러:', error.response?.data || error);
            throw new Error(error.message || '프로젝트 생성에 실패했습니다.');
        }
    },

    // 프로젝트 삭제
    deleteProject: async (projectId: number, userId: number): Promise<void> => {
        try {
            const response = await axiosInstance.delete<ApiResponse<void>>(`/projects/${projectId}?userId=${userId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || '프로젝트 삭제에 실패했습니다.');
            }
        } catch (error: any) {
            throw new Error(error.message || '프로젝트 삭제에 실패했습니다.');
        }
    },

    // 사이트의 프로젝트 목록 조회
    getProjectsBySite: async (siteId: number): Promise<Project[]> => {
        try {
            const response = await axiosInstance.get<{ success: boolean; projects: Project[]; count: number; message: string }>(`/projects/site/${siteId}`);
            console.log('프로젝트 목록 응답:', response.data); // 디버깅용 로그
            return response.data.projects || [];
        } catch (error: any) {
            console.error('프로젝트 목록 조회 에러:', error);
            throw new Error(error.message || '프로젝트 목록을 불러올 수 없습니다.');
        }
    },

    // 프로젝트 키로 프로젝트 조회
    getProjectByKey: async (key: string): Promise<Project> => {
        try {
            const response = await axiosInstance.get<ApiResponse<Project>>(`/projects/key/${key}`);
            if (!response.data.success) {
                throw new Error(response.data.message || '프로젝트를 찾을 수 없습니다.');
            }
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || '프로젝트를 찾을 수 없습니다.');
        }
    },

    // PM 초대
    invitePm: async (projectId: number, userId: string, inviterId: number): Promise<string> => {
        try {
            const response = await axiosInstance.post<ApiResponse<string>>(`/projects/${projectId}/invite-pm`, {
                projectId,
                userId,
                inviterId
            });
            if (!response.data.success) {
                throw new Error(response.data.message || 'PM 초대에 실패했습니다.');
            }
            return response.data.message || 'PM이 초대되었습니다.';
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'PM 초대에 실패했습니다.');
        }
    },

    // 일반 멤버 초대
    inviteMember: async (projectId: number, userId: string, inviterId: number): Promise<string> => {
        try {
            const response = await axiosInstance.post<ApiResponse<string>>(`/projects/${projectId}/invite-member`, {
                projectId,
                userId,
                inviterId
            });
            if (!response.data.success) {
                throw new Error(response.data.message || '멤버 초대에 실패했습니다.');
            }
            return response.data.message || '멤버가 초대되었습니다.';
        } catch (error: any) {
            throw new Error(error.response?.data?.message || '멤버 초대에 실패했습니다.');
        }
    },

    // 멤버 역할 변경
    changeRole: async (projectId: number, userId: string, newRole: string, changerId: number): Promise<string> => {
        try {
            const response = await axiosInstance.patch<ApiResponse<string>>(`/projects/${projectId}/members/${userId}/role`, {
                role: newRole,
                changerId
            });
            if (!response.data.success) {
                throw new Error(response.data.message || '역할 변경에 실패했습니다.');
            }
            return response.data.message || '역할이 변경되었습니다.';
        } catch (error: any) {
            throw new Error(error.response?.data?.message || '역할 변경에 실패했습니다.');
        }
    },

    // 멤버 삭제
    removeMember: async (projectId: number, userId: string, removerId: number): Promise<string> => {
        try {
            const response = await axiosInstance.delete<ApiResponse<string>>(`/projects/${projectId}/members/${userId}?removerId=${removerId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || '멤버 삭제에 실패했습니다.');
            }
            return response.data.message || '멤버가 삭제되었습니다.';
        } catch (error: any) {
            throw new Error(error.response?.data?.message || '멤버 삭제에 실패했습니다.');
        }
    },

    getProjectIssues: async (projectId: number) => {
        const response = await axiosInstance.get(`/projects/${projectId}/issues`);
        return response.data;
    },

    createIssue: async (projectId: number, data: any) => {
        const response = await axiosInstance.post(`/projects/${projectId}/issues`, data);
        return response.data;
    },

    // 이슈 수정
    updateIssue: async (projectId: number, issueId: number, data: {
        title: string;
        description: string;
        status: string;
        startDate: string;
        endDate: string;
        assigneeId: string;
    }): Promise<any> => {
        try {
            // 로컬 스토리지나 세션 스토리지에서 토큰 가져오기
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('로그인이 필요합니다.');
            }

            const response = await axiosInstance.put(`/projects/${projectId}/issues/${issueId}`, {
                title: data.title,
                description: data.description,
                status: data.status,
                startDate: data.startDate,
                endDate: data.endDate,
                assigneeId: data.assigneeId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    },

    deleteIssue: async (projectId: number, issueId: number) => {
        const response = await axiosInstance.delete(`/projects/${projectId}/issues/${issueId}`);
        return response.data;
    },

    updateIssueOrders: async (projectId: number, orderList: UpdateIssueOrderRequest[], userId: number) => {
        const response = await axiosInstance.patch(`/projects/${projectId}/issues/order?userId=${userId}`, orderList);
        return response.data;
    },

    getCustomStatuses: async (projectId: number) => {
        const response = await axiosInstance.get(`/projects/${projectId}/statuses`);
        return response.data;
    },

    createCustomStatus: async (projectId: number, name: string, userId: number) => {
        const response = await axiosInstance.post(`/projects/${projectId}/statuses?name=${name}`, { userId });
        return response.data;
    },

    updateCustomStatus: async (projectId: number, statusId: number, name: string, userId: number) => {
        const response = await axiosInstance.put(`/projects/${projectId}/statuses/${statusId}?name=${name}`, { userId });
        return response.data;
    },

    deleteCustomStatus: async (projectId: number, statusId: number, userId: number) => {
        const response = await axiosInstance.delete(`/projects/${projectId}/statuses/${statusId}?userId=${userId}`);
        return response.data;
    },

    // 최근 프로젝트 조회
    getRecentProjects: async (siteId: number, userId?: number, onlyMine: boolean = false): Promise<Project[]> => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId.toString());
            if (onlyMine) params.append('onlyMine', 'true');
            
            const response = await axiosInstance.get<ApiResponse<Project[]>>(
                `/projects/site/${siteId}/recent${params.toString() ? `?${params.toString()}` : ''}`
            );
            return response.data.data || [];
        } catch (error) {
            console.error('최근 프로젝트 조회 실패:', error);
            return [];
        }
    },

    // 최근 작업 조회
    getRecentWorks: async (siteId: number): Promise<RecentWork[]> => {
        try {
            const response = await axiosInstance.get<ApiResponse<RecentWork[]>>(`/projects/site/${siteId}/recent-works`);
            return response.data.data || [];
        } catch (error) {
            console.error('최근 작업 조회 실패:', error);
            return [];
        }
    },

    // 미해결 이슈 조회
    getUnresolvedIssues: async (siteId: number): Promise<UnresolvedIssue[]> => {
        try {
            if (!siteId || isNaN(siteId)) {
                console.error('유효하지 않은 사이트 ID:', siteId);
                return [];
            }

            const response = await axiosInstance.get<ApiResponse<UnresolvedIssue[]>>(`/projects/site/${siteId}/unresolved`);
            return response.data.data || [];
        } catch (error: any) {
            console.error('미해결 이슈 조회 에러:', error);
            return [];
        }
    },

    // 프로젝트 멤버 목록 조회
    getProjectMembers: async (projectId: number): Promise<ProjectMember[]> => {
        const response = await axiosInstance.get<ProjectMember[]>(`/projects/${projectId}/members`);
        return response.data;
    },

    // 프로젝트 방문 기록
    recordProjectVisit: async (projectId: number, userId: number): Promise<void> => {
        try {
            await axiosInstance.post(`/api/projects/${projectId}/visit?userId=${userId}`);
        } catch (error) {
            console.error('프로젝트 방문 기록 실패:', error);
        }
    }
};

export default projectService;