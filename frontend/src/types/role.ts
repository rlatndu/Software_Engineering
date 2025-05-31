export enum UserRole {
  ADMIN = 'ADMIN',           // 사이트 관리자
  PM = 'PM',                 // 프로젝트 관리자
  MEMBER = 'MEMBER'          // 일반 사용자
}

export interface UserPermissions {
  canManageSystem: boolean;      // 시스템 설정 변경 권한
  canAccessAllProjects: boolean; // 모든 프로젝트 접근 권한
  canManageUsers: boolean;       // 사용자 관리 권한
  canCreateProject: boolean;     // 프로젝트 생성 권한
  canInviteUsers: boolean;       // 사용자 초대 권한
  canManageProjectSettings: boolean; // 프로젝트 설정 관리 권한
  canManageIssues: boolean;     // 이슈 관리 권한
  canCreateIssue: boolean;      // 이슈 생성 권한
  canComment: boolean;          // 댓글 작성 권한
}

export interface UserRoles {
  siteRole?: UserRole;           // 사이트 멤버 role
  projectRoles: { [projectId: number]: UserRole };  // 프로젝트별 role
}

export const getRolePermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canManageSystem: true,
        canAccessAllProjects: true,
        canManageUsers: true,
        canCreateProject: true,
        canInviteUsers: true,
        canManageProjectSettings: true,
        canManageIssues: true,
        canCreateIssue: true,
        canComment: true
      };
    case UserRole.PM:
      return {
        canManageSystem: false,
        canAccessAllProjects: false,
        canManageUsers: false,
        canCreateProject: true,
        canInviteUsers: true,
        canManageProjectSettings: true,
        canManageIssues: true,
        canCreateIssue: true,
        canComment: true
      };
    case UserRole.MEMBER:
      return {
        canManageSystem: false,
        canAccessAllProjects: false,
        canManageUsers: false,
        canCreateProject: false,
        canInviteUsers: false,
        canManageProjectSettings: false,
        canManageIssues: false,
        canCreateIssue: true,
        canComment: true
      };
    default:
      return {
        canManageSystem: false,
        canAccessAllProjects: false,
        canManageUsers: false,
        canCreateProject: false,
        canInviteUsers: false,
        canManageProjectSettings: false,
        canManageIssues: false,
        canCreateIssue: false,
        canComment: false
      };
  }
}; 