import axios from 'axios';
import { getCurrentUser } from '../utils/auth';

export interface Column {
  id: number;
  title: string;
  icon: string;
  projectId: number;
  order: number;
}

export interface Issue {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  assigneeId?: string;
  reporterId?: string;
  projectId: number;
  columnId?: number;
  order?: number;
}

// 기본 칼럼 타입 정의
export type DefaultColumnId = 1 | 2 | 3 | 4;

export interface DefaultColumn {
  id: DefaultColumnId;
  title: string;
  status: string;
}

// 기본 칼럼 상수 정의
export const DEFAULT_COLUMNS: Record<string, DefaultColumn> = {
  TODO: { id: 1, title: '할 일', status: 'TODO' },
  IN_PROGRESS: { id: 2, title: '진행 중', status: 'IN_PROGRESS' },
  DONE: { id: 3, title: '완료', status: 'DONE' },
  HOLD: { id: 4, title: '보류', status: 'HOLD' }
};

// 칼럼 관련 상수
export const COLUMN_CONSTANTS = {
  // MAX_COLUMNS: 10, // 최대 칼럼 수 - 추후 적용 예정
  DEFAULT_COLUMNS: {
    TODO: { id: 1, title: '할 일', status: 'TODO', icon: '/assets/todo.png' },
    IN_PROGRESS: { id: 2, title: '진행 중', status: 'IN_PROGRESS', icon: '/assets/inprogress.png' },
    DONE: { id: 3, title: '완료', status: 'DONE', icon: '/assets/done.png' },
    HOLD: { id: 4, title: '보류', status: 'HOLD', icon: '/assets/hold.png' }
  },
  CUSTOM_COLUMN_START_ID: 5 // 사용자 정의 칼럼의 시작 ID를 5로 변경
} as const;

const BASE_URL = 'http://localhost:8081/api';

const boardService = {
  // 컬럼 관련 API
  getColumns: async (projectId: number): Promise<Column[]> => {
    const response = await axios.get<Column[]>(`${BASE_URL}/projects/${projectId}/columns`);
    return response.data;
  },

  createColumn: async (projectId: number, title: string): Promise<Column> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 현재 칼럼 목록 조회
    const currentColumns = await boardService.getColumns(projectId);
    
    /* 추후 적용 예정
    // 최대 칼럼 수 체크
    if (currentColumns.length >= COLUMN_CONSTANTS.MAX_COLUMNS) {
      throw new Error(`칼럼은 최대 ${COLUMN_CONSTANTS.MAX_COLUMNS}개까지만 생성할 수 있습니다.`);
    }
    */

    // 기본 칼럼 타이틀과 중복 체크
    const defaultColumnTitles = Object.values(COLUMN_CONSTANTS.DEFAULT_COLUMNS).map(col => col.title);
    if (defaultColumnTitles.some(defaultTitle => defaultTitle.toLowerCase() === title.toLowerCase())) {
      throw new Error('기본 칼럼과 동일한 이름은 사용할 수 없습니다.');
    }

    // 사용자 정의 칼럼 중복 체크
    const customColumns = currentColumns.filter(col => col.id >= COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID);
    if (customColumns.some(col => col.title.toLowerCase() === title.toLowerCase())) {
      throw new Error('이미 존재하는 칼럼 이름입니다.');
    }

    const response = await axios.post<Column>(`${BASE_URL}/projects/${projectId}/columns`, {
      title,
      icon: '/assets/custom-column.png',
      orderIndex: currentColumns.length // 마지막 순서로 추가
    });

    return response.data;
  },

  updateColumn: async (columnId: number, title: string): Promise<Column> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 기본 칼럼 수정 제한
    if (columnId < COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID) {
      throw new Error('기본 칼럼은 수정할 수 없습니다.');
    }

    const response = await axios.put<Column>(`${BASE_URL}/columns/${columnId}`, {
      title
    });
    return response.data;
  },

  deleteColumn: async (columnId: number): Promise<void> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 기본 칼럼 삭제 제한
    if (columnId < COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID) {
      throw new Error('기본 칼럼은 삭제할 수 없습니다.');
    }

    await axios.delete(`${BASE_URL}/columns/${columnId}`);
  },

  updateColumnsOrder: async (projectId: number, columnIds: number[]): Promise<void> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 기본 칼럼의 순서는 항상 유지
    const defaultColumnIds = Object.values(COLUMN_CONSTANTS.DEFAULT_COLUMNS).map(col => col.id);
    const customColumnIds = columnIds.filter(id => id >= COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID);
    
    const orderedColumnIds = [...defaultColumnIds, ...customColumnIds];

    await axios.put(`${BASE_URL}/projects/${projectId}/columns/order`, {
      columnIds: orderedColumnIds
    });
  },

  // 이슈 관련 API
  getIssues: async (projectId: number): Promise<{ [columnId: number]: Issue[] }> => {
    const response = await axios.get<{ [key: string]: Issue[] }>(`${BASE_URL}/projects/${projectId}/issues`);
    return response.data;
  },

  createIssue: async (projectId: number, columnId: number, issue: Partial<Issue>): Promise<Issue> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 컬럼 존재 여부 확인
    const columns = await boardService.getColumns(projectId);
    if (!columns.some(col => col.id === columnId)) {
      throw new Error('유효하지 않은 컬럼입니다.');
    }
    
    // 현재 컬럼의 이슈들을 가져와서 마지막 순서 계산
    const issues = await boardService.getIssues(projectId);
    const columnIssues = issues[columnId] || [];
    const lastOrder = columnIssues.length > 0 
      ? Math.max(...columnIssues.map(issue => issue.order || 0))
      : -1;
    const newOrder = lastOrder + 1;
    
    // 상태값 정규화
    let status = issue.status;
    switch (status?.toUpperCase()) {
      case 'TO DO':
      case 'TODO':
        status = 'TODO';
        break;
      case 'IN PROGRESS':
      case 'IN_PROGRESS':
        status = 'IN_PROGRESS';
        break;
      case 'DONE':
        status = 'DONE';
        break;
      default:
        // 커스텀 상태는 그대로 사용
        status = status || 'TODO';
    }

    const requestData = {
      title: issue.title,
      description: issue.description || "",
      status: status,
      startDate: issue.startDate,
      endDate: issue.endDate,
      assigneeId: issue.assigneeId || null,
      reporterId: user.userId,
      columnId: Number(columnId),  // 선택된 컬럼 ID 사용
      order: newOrder
    };

    console.log('Sending request with data:', requestData);
    
    try {
      const response = await axios.post<Issue>(`${BASE_URL}/projects/${projectId}/issues`, requestData);
      console.log('Created issue response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  },

  updateIssue: async (issueId: number, data: Partial<Issue>): Promise<Issue> => {
    try {
      if (!data.projectId) {
        throw new Error('프로젝트 ID가 필요합니다.');
      }
      const response = await axios.put<Issue>(`${BASE_URL}/projects/${data.projectId}/issues/${issueId}`, data);
      return response.data;
    } catch (error) {
      console.error('이슈 수정 실패:', error);
      throw error;
    }
  },

  deleteIssue: async (projectId: number, issueId: number): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/projects/${projectId}/issues/${issueId}`);
    } catch (error) {
      console.error('이슈 삭제 실패:', error);
      throw error;
    }
  },

  moveIssue: async (issueId: number, targetColumnId: number, order: number): Promise<void> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    await axios.put(`${BASE_URL}/issues/${issueId}/move`, {
      targetColumnId,
      order,
      userId: user.id
    });
  },

  updateIssueStatus: async (issueId: number, status: string, columnId: number, order: number, projectId: number): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/projects/${projectId}/issues/${issueId}`, {
        status,
        columnId,
        order
      });
      return response.data;
    } catch (error) {
      console.error('이슈 상태 업데이트 실패:', error);
      throw error;
    }
  }
};

export default boardService; 