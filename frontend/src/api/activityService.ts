import axios from 'axios';
import { ActivityLog, ActivityFilter, ActivityType } from '../types/activity';

const API_URL = '/activity-logs';

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const activityService = {
  // 활동 내역 생성
  createActivityLog: async (data: {
    userId: number;
    type: ActivityType;
    title: string;
    content: string;
    projectId?: number;
    issueId?: number;
    commentId?: number;
    targetPage?: string;
    statusChange?: string;
  }) => {
    try {
      const response = await axios.post<ApiResponse<ActivityLog>>(API_URL, data);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('활동 내역 생성 실패:', error);
      throw new Error(error.response?.data?.message || '활동 내역 생성에 실패했습니다.');
    }
  },

  // 활동 로그 조회 (필터링 포함)
  getActivityLogs: async (filter: ActivityFilter) => {
    try {
      const response = await axios.get<ApiResponse<ActivityLog[]>>(API_URL, { params: filter });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('활동 로그 조회 실패:', error);
      throw new Error(error.response?.data?.message || '활동 로그 조회에 실패했습니다.');
    }
  },

  // 특정 사용자의 최근 활동 조회
  getUserRecentActivities: async (userId: number, limit: number = 30) => {
    try {
      const response = await axios.get<ApiResponse<ActivityLog[]>>(`${API_URL}/user/${userId}/recent`, {
        params: { limit }
      });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('사용자 활동 내역 조회 실패:', error);
      throw new Error(error.response?.data?.message || '사용자 활동 내역 조회에 실패했습니다.');
    }
  },

  // 프로젝트의 최근 활동 조회
  getProjectRecentActivities: async (projectId: number, limit: number = 30) => {
    try {
      const response = await axios.get<ApiResponse<ActivityLog[]>>(`${API_URL}/project/${projectId}/recent`, {
        params: { limit }
      });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('프로젝트 활동 내역 조회 실패:', error);
      throw new Error(error.response?.data?.message || '프로젝트 활동 내역 조회에 실패했습니다.');
    }
  },

  // 30일 이전 활동 로그 자동 삭제 (서버에서 스케줄러로 실행)
  cleanupOldActivities: async () => {
    try {
      const response = await axios.delete<ApiResponse<void>>(`${API_URL}/cleanup`);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.success;
    } catch (error: any) {
      console.error('오래된 활동 내역 삭제 실패:', error);
      throw new Error(error.response?.data?.message || '오래된 활동 내역 삭제에 실패했습니다.');
    }
  },

  // 사이트의 활동 내역 조회
  getSiteActivities: async (siteId: number, userId?: number, limit: number = 30) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      params.append('limit', limit.toString());
      
      const response = await axios.get<ApiResponse<ActivityLog[]>>(`${API_URL}/site/${siteId}`, { params });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('사이트 활동 내역 조회 실패:', error);
      throw new Error(error.response?.data?.message || '사이트 활동 내역 조회에 실패했습니다.');
    }
  },

  // 프로젝트의 최근 활동 조회
  getProjectActivities: async (projectId: number, limit: number = 30) => {
    const response = await axios.get<ApiResponse<ActivityLog[]>>(`${API_URL}/project/${projectId}/recent`, {
      params: { limit }
    });
    return response.data.data;
  }
}; 