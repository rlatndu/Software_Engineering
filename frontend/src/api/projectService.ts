import axios from './axios';

export interface CreateProjectRequest {
    siteId: number;
    name: string;
    key: string;
    isPrivate: boolean;
    creatorId: number;
}

export interface UpdateIssueOrderRequest {
    issueId: number;
    newOrder: number;
}

export const projectService = {
    createProject: async (data: CreateProjectRequest) => {
        const response = await axios.post('/projects', data);
        return response.data;
    },

    deleteProject: async (projectId: number, userId: number) => {
        const response = await axios.delete(`/projects/${projectId}?userId=${userId}`);
        return response.data;
    },

    getProjectIssues: async (projectId: number) => {
        const response = await axios.get(`/projects/${projectId}/issues`);
        return response.data;
    },

    createIssue: async (projectId: number, data: any) => {
        const response = await axios.post(`/projects/${projectId}/issues`, data);
        return response.data;
    },

    updateIssue: async (projectId: number, issueId: number, data: any) => {
        const response = await axios.put(`/projects/${projectId}/issues/${issueId}`, data);
        return response.data;
    },

    deleteIssue: async (projectId: number, issueId: number) => {
        const response = await axios.delete(`/projects/${projectId}/issues/${issueId}`);
        return response.data;
    },

    updateIssueOrders: async (projectId: number, orderList: UpdateIssueOrderRequest[], userId: number) => {
        const response = await axios.patch(`/projects/${projectId}/issues/order?userId=${userId}`, orderList);
        return response.data;
    },

    getCustomStatuses: async (projectId: number) => {
        const response = await axios.get(`/projects/${projectId}/statuses`);
        return response.data;
    },

    createCustomStatus: async (projectId: number, name: string, userId: number) => {
        const response = await axios.post(`/projects/${projectId}/statuses?name=${name}`, { userId });
        return response.data;
    },

    updateCustomStatus: async (projectId: number, statusId: number, name: string, userId: number) => {
        const response = await axios.put(`/projects/${projectId}/statuses/${statusId}?name=${name}`, { userId });
        return response.data;
    },

    deleteCustomStatus: async (projectId: number, statusId: number, userId: number) => {
        const response = await axios.delete(`/projects/${projectId}/statuses/${statusId}?userId=${userId}`);
        return response.data;
    }
}; 