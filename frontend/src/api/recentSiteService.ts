import { Site } from './siteService';

interface RecentSite extends Site {
  visitedAt: string;
}

class RecentSiteService {
  private readonly STORAGE_KEY = 'recentSites';
  private readonly MAX_RECENT_SITES = 10;

  // 최근 방문 사이트 저장
  addRecentSite(site: Site): void {
    const recentSites = this.getRecentSites();
    
    // 이미 있는 사이트라면 제거
    const filteredSites = recentSites.filter(s => s.id !== site.id);
    
    // 새 사이트를 맨 앞에 추가
    const newSite: RecentSite = {
      ...site,
      visitedAt: new Date().toISOString()
    };
    
    filteredSites.unshift(newSite);
    
    // 최대 개수 유지
    const updatedSites = filteredSites.slice(0, this.MAX_RECENT_SITES);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSites));
  }

  // 최근 방문 사이트 목록 조회
  getRecentSites(): RecentSite[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // 내 사이트 중 최근 방문한 것만 필터링
  getMyRecentSites(): RecentSite[] {
    // TODO: 실제 사용자 정보와 연동하여 필터링
    return this.getRecentSites();
  }
}

export const recentSiteService = new RecentSiteService(); 