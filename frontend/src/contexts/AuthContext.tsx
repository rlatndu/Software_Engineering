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

  // 사용자 권한 정보 업데이트 함수
  const updateUserRoles = async (siteId?: number, projectId?: number) => {
    if (!user) return;

    try {
      // 1. 사이트 권한 업데이트
      if (siteId) {
        const siteMemberRole = await siteService.getSiteMemberRole(siteId, user.userId);
        if (siteMemberRole) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              roles: {
                ...prev.roles,
                siteRole: siteMemberRole
              }
            };
          });
        }
      }

      // 2. 프로젝트 권한 업데이트
      if (projectId) {
        const projectMembers = await projectService.getProjectMembers(projectId);
        const userProjectRole = projectMembers.find(member => member.userId === user.userId)?.role;
        
        if (userProjectRole) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              roles: {
                ...prev.roles,
                projectRoles: {
                  ...prev.roles.projectRoles,
                  [projectId]: userProjectRole as UserRole
                }
              }
            };
          });
        }
      }
    } catch (error) {
      console.error('Failed to update user roles:', error);
    }
  };

  // 초기 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('Found token:', token ? 'Yes' : 'No');
        
        if (!token) {
          console.log('No token found, setting loading to false');
          setLoading(false);
          return;
        }

        // 토큰을 먼저 헤더에 설정
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Set initial token in axios headers:', axios.defaults.headers.common['Authorization']);

        // 토큰 검증
        const isValidToken = await verifyToken(token);
        console.log('Token validation result:', isValidToken);

        if (!isValidToken) {
          console.log('Token is invalid, clearing auth data');
          logout();
          setLoading(false);
          return;
        }

        // 토큰이 유효하면 사용자 정보 로드
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        console.log('Found stored user:', storedUser ? 'Yes' : 'No');

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
                await updateUserRoles(currentSiteId);
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
          if (!config.headers) {
            config.headers = {};
          }
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
    <AuthContext.Provider value={{ user, setUser, loading, isAuthenticated, updateUserRoles, login, logout }}>
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