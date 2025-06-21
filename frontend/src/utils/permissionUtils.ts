import { UserRole, UserPermissions, getRolePermissions, UserRoles, User } from '../types/role';
import { Project } from '../types/project';

export const checkPermission = (
  user: User | null,
  permission: keyof UserPermissions,
  project?: Project,
  siteId?: number
): boolean => {
  if (!user) return false;

  // 1. 사이트 ADMIN 권한 체크
  if (user.roles.siteRole === UserRole.ADMIN) {
    return true;
  }

  // 2. 프로젝트 관련 권한 체크
  if (project) {
    // 2.1 프로젝트 생성자인 경우 PM 권한 부여
    if (project.createdBy.id === user.id) {
      const pmPermissions = getRolePermissions(UserRole.PM);
      return pmPermissions[permission];
    }

    // 2.2 프로젝트별 역할이 있는 경우
    const projectRole = user.roles.projectRoles[project.id];
    if (projectRole) {
      const projectRolePermissions = getRolePermissions(projectRole);
      return projectRolePermissions[permission];
    }
  }

  // 3. 사이트 역할 체크
  if (siteId && user.roles.siteRole) {
    const siteRolePermissions = getRolePermissions(user.roles.siteRole);
    return siteRolePermissions[permission];
  }

  // 4. 기본 멤버 권한 체크
  const defaultPermissions = getRolePermissions(UserRole.MEMBER);
  return defaultPermissions[permission];
};

export const canManageProject = (user: User | null, project: Project): boolean => {
  if (!user) return false;
  
  // 1. 사이트 관리자는 모든 프로젝트 관리 가능
  if (user.roles.siteRole === UserRole.ADMIN) {
    return true;
  }
  
  // 2. 프로젝트 생성자는 관리 가능
  if (project.createdBy.id === user.id) {
    return true;
  }
  
  // 3. 프로젝트별 역할이 PM 또는 ADMIN인 경우 관리 가능
  const projectRole = user.roles.projectRoles[project.id];
  if (projectRole === UserRole.PM || projectRole === UserRole.ADMIN) {
    return true;
  }

  // 4. 사이트 역할이 PM인 경우 관리 가능
  if (user.roles.siteRole === UserRole.PM) {
    return true;
  }
  
  return false;
};

export const canManageIssues = (user: User | null, project: Project): boolean => {
  return checkPermission(user, 'canManageIssues', project);
};

export const canMoveIssueWithinColumn = (user: User | null, project: Project): boolean => {
  if (!user) return false;
  
  // 프로젝트 멤버인지 확인
  const projectRole = user.roles.projectRoles[project.id];
  return projectRole !== undefined;
};

export const canMoveIssueBetweenColumns = (
  user: User | null, 
  project: Project, 
  issueAssigneeId?: number
): boolean => {
  if (!user) return false;
  
  // 1. 사이트 ADMIN 권한 체크
  if (user.roles.siteRole === UserRole.ADMIN) {
    return true;
  }

  // 2. 프로젝트 PM 또는 ADMIN 권한 체크
  const projectRole = user.roles.projectRoles[project.id];
  if (projectRole === UserRole.PM || projectRole === UserRole.ADMIN) {
    return true;
  }

  // 3. 이슈 담당자 체크
  return issueAssigneeId !== undefined && user.id === issueAssigneeId;
};

export const canCreateIssue = (user: User | null, project: Project): boolean => {
  return checkPermission(user, 'canCreateIssue', project);
};

export const canComment = (user: User | null, project: Project): boolean => {
  return checkPermission(user, 'canComment', project);
}; 