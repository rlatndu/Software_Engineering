export interface Issue {
    id: number;
    title: string;
    status: string;
    reporter: string;
    description?: string;
    projectId: number;
    createdAt: string;
    updatedAt: string;
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