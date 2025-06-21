import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserRoles } from '../types/role';
import axios from 'axios';
import projectService from '../api/projectService';
import siteService from '../api/siteService';
import authService from '../api/authService';

interface User {
  id: number;
  name: string;
  userId: string;
  email: string;
  roles: UserRoles;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  updateUserRoles: (siteId?: number, projectId?: number) => Promise<void>;
  updateAllProjectRoles: (siteId: number) => Promise<void>;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 로그인 함수
  const login = (userData: User) => {
    console.log('Setting user in AuthContext:', userData);
    setUser(userData);
  };

  // 로그아웃 함수
  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // 토큰 검증 함수
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      console.log('Verifying token:', token ? 'Token exists' : 'No token');
      
      // 토큰을 헤더에 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Set token in axios headers:', axios.defaults.headers.common['Authorization']);
      
      // 토큰 검증 요청
      const response = await authService.verifyToken();
      console.log('Token verification response:', response);
      
      if (!response.isValid) {
        console.log('Token is invalid, removing from storage');
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
      return false;
    }
  };

  // 사이트의 모든 프로젝트 권한 업데이트 함수
  const updateAllProjectRoles = async (siteId: number) => {
    if (!user) return;

    try {
      // 1. 사이트 권한 업데이트
      const siteMemberRole = await siteService.getSiteMemberRole(siteId, user.userId);
      let updatedRoles = { ...user.roles };
      
      if (siteMemberRole && siteMemberRole !== updatedRoles.siteRole) {
        updatedRoles.siteRole = siteMemberRole as UserRole;
      }

      // 2. 사이트의 모든 프로젝트 목록 가져오기
      const projects = await projectService.getProjects(siteId);
      
      // 3. 각 프로젝트의 멤버 목록을 한 번에 가져오기
      const projectMembersPromises = projects.map(project => 
        projectService.getProjectMembers(project.id)
      );
      const projectMembersResults = await Promise.all(projectMembersPromises);

      // 4. 프로젝트별 권한 설정
      const newProjectRoles: { [projectId: number]: UserRole } = {};
      
      projects.forEach((project, index) => {
        const members = projectMembersResults[index];
        const userProjectRole = members.find(member => member.userId === user.userId)?.role;
        
        // 사이트 ADMIN인 경우 프로젝트 ADMIN 권한 부여
        if (updatedRoles.siteRole === UserRole.ADMIN) {
          newProjectRoles[project.id] = UserRole.ADMIN;
        } else if (userProjectRole) {
          newProjectRoles[project.id] = userProjectRole;
        }
      });

      // 5. 권한 업데이트
      updatedRoles.projectRoles = newProjectRoles;
      
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          roles: updatedRoles
        };
      });
    } catch (error) {
      console.error('Failed to update all project roles:', error);
    }
  };

  // 개별 프로젝트 권한 업데이트 함수
  const updateUserRoles = async (siteId?: number, projectId?: number) => {
    if (!user) return;

    try {
      let updatedRoles = { ...user.roles };
      let rolesChanged = false;
      
      // 1. 사이트 권한 업데이트
      if (siteId) {
        const siteMemberRole = await siteService.getSiteMemberRole(siteId, user.userId);
        if (siteMemberRole && siteMemberRole !== updatedRoles.siteRole) {
          updatedRoles.siteRole = siteMemberRole;
          rolesChanged = true;
        }
      }

      // 2. 프로젝트 권한 업데이트
      if (projectId) {
        const projectMembers = await projectService.getProjectMembers(projectId);
        let userProjectRole = projectMembers.find(member => member.userId === user.userId)?.role;
        
        // 사이트 ADMIN인 경우 프로젝트 ADMIN 권한 부여
        if (updatedRoles.siteRole === UserRole.ADMIN) {
          userProjectRole = UserRole.ADMIN;
        }
        
        const currentProjectRole = updatedRoles.projectRoles[projectId];
        if (userProjectRole && userProjectRole !== currentProjectRole) {
          updatedRoles.projectRoles = {
            ...updatedRoles.projectRoles,
            [projectId]: userProjectRole
          };
          rolesChanged = true;
        }
      }

      // 변경된 경우에만 상태 업데이트
      if (rolesChanged) {
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            roles: updatedRoles
          };
        });
      }
    } catch (error) {
      console.error('Failed to update user roles:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (!token) {
          console.log('No token found');
          logout();
          return;
        }

        // 토큰 검증
        const isValid = await verifyToken(token);
        if (!isValid) {
          console.log('Token is invalid');
          return;
        }

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('Parsed stored user:', parsedUser);

            const userWithRoles = {
              ...parsedUser,
              roles: {
                siteRole: parsedUser.roles?.siteRole,
                projectRoles: parsedUser.roles?.projectRoles || {}
              }
            };
            
            login(userWithRoles);
            console.log('Successfully set user state:', userWithRoles);

            // URL에서 siteId 추출
            const pathSegments = window.location.pathname.split('/');
            const siteIdIndex = pathSegments.indexOf('sites') + 1;
            if (siteIdIndex > 0 && pathSegments[siteIdIndex]) {
              const currentSiteId = parseInt(pathSegments[siteIdIndex]);
              if (!isNaN(currentSiteId)) {
                // 사이트의 모든 프로젝트 권한을 한 번에 업데이트
                await updateAllProjectRoles(currentSiteId);
              }
            }
          } catch (error) {
            console.error('Failed to parse user data:', error);
            logout();
          }
        } else {
          console.log('No stored user data found');
          logout();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // axios 인터셉터 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // 사용자 정보 저장
  useEffect(() => {
    if (user) {
      console.log('Saving user data to storage:', user);
      const storage = sessionStorage.getItem('token') ? sessionStorage : localStorage;
      storage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const isAuthenticated = !!user;
  console.log('Current auth state:', { isAuthenticated, hasUser: !!user, user });

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isAuthenticated, updateUserRoles, updateAllProjectRoles, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 