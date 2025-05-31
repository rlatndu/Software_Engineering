import { UserRole } from '../types/role';

interface User {
  id: number;
  name: string;
  userId: string;
  role: UserRole;
  siteRole?: UserRole;  // 사이트 멤버 role
  projectRole?: UserRole;  // 프로젝트 멤버 role
}

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    // role을 문자열에서 UserRole enum으로 변환
    user.role = user.role === 'ADMIN' ? UserRole.ADMIN : 
                user.role === 'PM' ? UserRole.PM : 
                UserRole.MEMBER;
    
    // siteRole과 projectRole도 변환
    if (user.siteRole) {
      user.siteRole = user.siteRole === 'ADMIN' ? UserRole.ADMIN :
                      user.siteRole === 'PM' ? UserRole.PM :
                      UserRole.MEMBER;
    }
    if (user.projectRole) {
      user.projectRole = user.projectRole === 'ADMIN' ? UserRole.ADMIN :
                        user.projectRole === 'PM' ? UserRole.PM :
                        UserRole.MEMBER;
    }
    return user;
  } catch {
    return null;
  }
}; 