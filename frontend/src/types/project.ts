import { UserRole } from './role';

export interface CreateProjectRequest {
    siteId: number;
    name: string;
    key: string;
    isPrivate: boolean;
    creatorId: number;
    creatorRole: UserRole;
}

export interface Project {
    id: number;
    siteId: number;
    name: string;
    key: string;
    isPrivate: boolean;
    createdBy: {
        id: number;
        name?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface RecentProject extends Project {
    visitedAt: string;
}

export interface ProjectMember {
    id: number;
    userId: string;
    projectId: number;
    role: UserRole;
    joinedAt: string;
}

export interface UpdateIssueOrderRequest {
    issueId: number;
    order: number;
} 