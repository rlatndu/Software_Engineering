import axios from 'axios';

export interface Comment {
    id: number;
    content: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
}

const BASE_URL = 'http://localhost:8081/api';

const commentService = {
    getComments: async (issueId: number): Promise<Comment[]> => {
        const response = await axios.get<Comment[]>(`${BASE_URL}/issues/${issueId}/comments`);
        return response.data;
    },

    createComment: async (issueId: number, content: string): Promise<Comment> => {
        const response = await axios.post<Comment>(`${BASE_URL}/issues/${issueId}/comments`, {
            content
        });
        return response.data;
    },

    updateComment: async (issueId: number, commentId: number, content: string): Promise<Comment> => {
        const response = await axios.put<Comment>(`${BASE_URL}/issues/${issueId}/comments/${commentId}`, {
            content
        });
        return response.data;
    },

    deleteComment: async (issueId: number, commentId: number): Promise<void> => {
        await axios.delete(`${BASE_URL}/issues/${issueId}/comments/${commentId}`);
    }
};

export default commentService; 