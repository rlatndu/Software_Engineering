export type ActivityType = 
  | 'PAGE_NAVIGATION'
  | 'ISSUE_CREATE'
  | 'ISSUE_UPDATE'
  | 'ISSUE_STATUS_CHANGE'
  | 'COMMENT_CREATE'
  | 'COMMENT_UPDATE';

export interface ActivityLog {
  id: number;
  userId: number;
  type: ActivityType;
  title: string;
  content: string;
  timestamp: string;
  projectId: number;
  projectName: string;
  issueId?: number;
  issueName?: string;
  commentId?: number;
  targetPage?: string;
  statusChange?: string;
  updatedAt: string;
}

export interface ActivityFilter {
  userId?: number;
  projectId?: number;
  siteId?: number;
  limit?: number;
} 