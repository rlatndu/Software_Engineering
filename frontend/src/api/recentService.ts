import { Project, RecentProject } from '../types/project';

class RecentProjectService {
  private readonly STORAGE_KEY = 'recentProjects';
  private readonly MAX_RECENT_PROJECTS = 10;

  // 최근 방문 프로젝트 저장
  addRecentProject(project: Project): void {
    const recentProjects = this.getRecentProjects();
    
    // 이미 있는 프로젝트라면 제거
    const filteredProjects = recentProjects.filter(p => p.id !== project.id);
    
    // 새 프로젝트를 맨 앞에 추가
    const newProject: RecentProject = {
      ...project,
      visitedAt: new Date().toISOString()
    };
    
    filteredProjects.unshift(newProject);
    
    // 최대 개수 유지
    const updatedProjects = filteredProjects.slice(0, this.MAX_RECENT_PROJECTS);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProjects));
  }

  // 최근 방문 프로젝트 목록 조회
  getRecentProjects(): RecentProject[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // 특정 사이트의 최근 방문 프로젝트만 조회
  getRecentProjectsBySite(siteId: number): RecentProject[] {
    return this.getRecentProjects().filter(project => project.siteId === siteId);
  }

  // 내 프로젝트만 필터링 (향후 사용자 정보와 연동 필요)
  getMyRecentProjects(siteId: number): RecentProject[] {
    // TODO: 실제 사용자 정보와 연동하여 필터링
    return this.getRecentProjectsBySite(siteId);
  }
}

export const recentProjectService = new RecentProjectService(); 