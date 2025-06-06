export interface Issue {
    id: number;
    title: string;
    description: string;
    status: string;
    startDate?: string;
    endDate?: string;
    assigneeId?: number;
    assignee?: {
        id: number;
        name: string;
    };
    reporterId?: number;
    reporter?: {
        id: number;
        name: string;
    };
    createdAt?: string;
    updatedAt?: string;
    columnId?: number;
    order?: number;
    projectId?: number;
    projectName?: string;
}

export interface CreateIssueRequest {
    title: string;
    description?: string;
    projectId: number;
    reporterId: number;
    status: string;
}

export interface UpdateIssueRequest {
    title?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    assigneeId?: string;
}

export interface BacklogIssue extends Issue {
    order: number;
    sprintId?: number;
}

export interface BoardIssue extends Issue {
    columnId: number;
    order: number;
}

export interface UpdateIssueOrderRequest {
    issueId: number;
    newOrder: number;
}

export interface UnresolvedIssue {
    id: number;
    title: string;
    projectName: string;
    priority: string;
    dueDate: string;
}

export interface RecentWork {
    id: number;
    title: string;
    projectName: string;
    status: string;
    updatedAt: string;
} 