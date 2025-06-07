export type ActivityType = 
  | 'PAGE_NAVIGATION'
  | 'ISSUE_CREATE'
  | 'ISSUE_UPDATE'
  | 'ISSUE_STATUS_CHANGE'
  | 'COMMENT_CREATE'
  | 'COMMENT_UPDATE';

export interface ActivityLog {
  id: number;
  description: string;
  projectName: string;
  updatedAt: string;
}

export interface ActivityFilter {
  userId?: number;
  projectId?: number;
  siteId?: number;
  limit?: number;
} 