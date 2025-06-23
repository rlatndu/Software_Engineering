import axios from 'axios';
import { ApiResponse } from '../types/api';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const invitationService = {
  inviteToProject: async (projectId: number, email: string, inviterId: number, role: 'PM' | 'MEMBER') => {
    try {
      const resp = await axiosInstance.post<ApiResponse<any>>('/invitations/project', {
        projectId,
        inviteeEmail: email,
        inviterId,
        role,
      });

      if (!resp.data.success) {
        throw new Error(resp.data.message || '초대에 실패했습니다.');
      }
      return resp.data.message || '초대 메일이 발송되었습니다.';
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || '초대에 실패했습니다.';
      throw new Error(msg);
    }
  },

  acceptByToken: async (token: string) => {
    const resp = await axiosInstance.post<ApiResponse<any>>('/invitations/accept-by-token', null, { params: { token } });
    if (!resp.data.success) throw new Error(resp.data.message || '초대 수락에 실패했습니다.');
    return resp.data.message;
  },

  rejectByToken: async (token: string) => {
    const resp = await axiosInstance.post<ApiResponse<any>>('/invitations/reject-by-token', null, { params: { token } });
    if (!resp.data.success) throw new Error(resp.data.message || '초대 거절에 실패했습니다.');
    return resp.data.message;
  },
}; 