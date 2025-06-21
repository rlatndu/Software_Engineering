import React, { useState, useRef, useEffect } from 'react';
import IssueEditPopup from './IssueEditPopup';
import './ProjectBoardView.css';
import AccessDeniedPopup from '../../components/AccessDeniedPopup';
import ConfirmPopup from '../../components/ConfirmPopup';
import ResultPopup from '../../components/ResultPopup';
import IssueCreatePopup from './IssueCreatePopup';
import boardService, { Column as BoardColumn, Issue as BoardIssue, DEFAULT_COLUMNS, COLUMN_CONSTANTS } from '../../api/boardService';
import { canManageProject, canManageIssues, canCreateIssue } from '../../utils/permissionUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/project';
import commentService from '../../api/commentService';
import projectService from '../../api/projectService';
import { formatDate, formatDateShort } from '../../utils/dateUtils';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface ProjectBoardViewProps {
  project: Project;
}

interface PopupState {
  type: 'accessDenied' | 'confirmDelete' | 'result' | null;
  payload?: {
    message?: string;
    title?: string;
    id?: number;
  };
}

const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({ project }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [issuesByColumn, setIssuesByColumn] = useState<{ [columnId: number]: BoardIssue[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popup, setPopup] = useState<PopupState>({ type: null });

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [menuOpenComment, setMenuOpenComment] = useState<number | null>(null);
  const commentDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedIssue, setSelectedIssue] = useState<BoardIssue | null>(null);
  const [menuOpenColumn, setMenuOpenColumn] = useState<number | null>(null);
  const [menuOpenIssue, setMenuOpenIssue] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<BoardIssue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const issueDropdownRef = useRef<HTMLDivElement>(null);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 컬럼과 이슈 데이터를 동시에 불러옴
      const [columnsData, issuesData] = await Promise.all([
        boardService.getColumns(project.id),
        boardService.getIssues(project.id)
      ]);

      console.log('Loaded columns:', columnsData);
      console.log('Loaded issues:', issuesData);

      // 컬럼 데이터 설정
      if (columnsData && columnsData.length > 0) {
        // 컬럼을 order 기준으로 정렬
        const sortedColumns = [...columnsData].sort((a, b) => a.order - b.order);
        console.log('Sorted columns:', sortedColumns);
        setColumns(sortedColumns);
      }

      // 이슈 데이터 설정
      const initialIssuesByColumn: { [key: number]: BoardIssue[] } = {};
      columnsData.forEach(col => {
        initialIssuesByColumn[col.id] = issuesData[col.id] || [];
      });

      console.log('Setting issues by column:', initialIssuesByColumn);
      setIssuesByColumn(initialIssuesByColumn);
    } catch (err) {
      console.error('보드 데이터 로딩 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [project.id]);

  const handleEdit = async (issue: BoardIssue) => {
    if (!canManageIssues(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 수정할 권한이 없습니다.' }
      });
      return;
    }

    setMenuOpenIssue(null);
    try {
      const updatedIssue = await boardService.updateIssue(issue.id, issue);
      setIssuesByColumn(prev => {
        const updated = { ...prev };
        for (const colId in updated) {
          updated[colId] = updated[colId].map(i =>
            i.id === updatedIssue.id ? updatedIssue : i
          );
        }
        return updated;
      });
      
      // 약간의 지연 후 성공 팝업 표시
      setTimeout(() => {
        setPopup({ type: 'result', payload: { message: '수정되었습니다.' } });
      }, 100);
    } catch (err) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈 수정에 실패했습니다.' }
      });
    }
  };

  const handleDelete = (issue: BoardIssue) => {
    setMenuOpenIssue(null);
    setPopup({ 
      type: 'confirmDelete', 
      payload: { 
        title: issue.title,
        id: issue.id 
      } 
    });
  };

  const handleConfirmDelete = async () => {
    if (!popup.payload?.id) return;

    try {
      await boardService.deleteIssue(popup.payload.id, project.id);
      setPopup({ type: 'result', payload: { message: '이슈가 삭제되었습니다.' } });
      // 이슈 목록 새로고침
      loadBoardData();
    } catch (error) {
      console.error('이슈 삭제 실패:', error);
      setPopup({ type: 'result', payload: { message: '이슈 삭제에 실패했습니다.' } });
    }
  };

  const handleColumnEdit = async (column: BoardColumn, newTitle: string) => {
    if (!canManageProject(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '컬럼을 수정할 권한이 없습니다.' }
      });
      return;
    }

    try {
      // 기본 칼럼 수정 제한
      if (column.id < COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '기본 칼럼은 수정할 수 없습니다.' }
        });
        return;
      }

      // 기본 칼럼 이름과 중복 체크
      const defaultColumnTitles = Object.values(COLUMN_CONSTANTS.DEFAULT_COLUMNS).map(col => col.title.toLowerCase());
      if (defaultColumnTitles.includes(newTitle.toLowerCase())) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '기본 칼럼과 동일한 이름은 사용할 수 없습니다.' }
        });
        return;
      }

      // 사용자 정의 칼럼 중복 체크
      const customColumns = columns.filter(col => col.id >= COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID);
      if (customColumns.some(col => col.id !== column.id && col.title === newTitle)) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '이미 존재하는 칼럼 이름입니다.' }
        });
        return;
      }

      const updatedColumn = await boardService.updateColumn(column.id, newTitle);
      setColumns(prev => prev.map(col => 
        col.id === updatedColumn.id ? updatedColumn : col
      ));
      setMenuOpenColumn(null);
      setPopup({ type: 'result', payload: { message: '칼럼이 수정되었습니다.' } });
    } catch (err: any) {
      setPopup({
        type: 'accessDenied',
        payload: { message: err.message || '칼럼 수정에 실패했습니다.' }
      });
    }
  };

  const handleColumnDelete = async (columnId: number) => {
    if (!canManageProject(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '컬럼을 삭제할 권한이 없습니다.' }
      });
      return;
    }

    try {
      // 기본 칼럼 삭제 제한
      if (columnId < COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '기본 칼럼은 삭제할 수 없습니다.' }
        });
        return;
      }

      await boardService.deleteColumn(columnId);
      setColumns(prev => prev.filter(col => col.id !== columnId));
      setMenuOpenColumn(null);
      setPopup({ type: 'result', payload: { message: '칼럼이 삭제되었습니다.' } });
    } catch (err: any) {
      setPopup({
        type: 'accessDenied',
        payload: { message: err.message || '칼럼 삭제에 실패했습니다.' }
      });
    }
  };

  const handleCreateIssue = async (columnId: number, issueData: Partial<BoardIssue>) => {
    if (!canCreateIssue(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 생성할 권한이 없습니다.' }
      });
      return Promise.reject(new Error('이슈를 생성할 권한이 없습니다. PM 또는 관리자만 이슈를 생성할 수 있습니다.'));
    }

    try {
      const createData = {
        ...issueData,
        columnId: columnId,
        projectId: project.id,
        reporterId: user?.userId,
        startDate: issueData.startDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
        endDate: issueData.endDate || new Date(new Date().setHours(23, 59, 59, 999) - new Date().getTimezoneOffset() * 60000).toISOString()
      };

      console.log('Creating issue with data:', createData);
      const newIssue = await boardService.createIssue(project.id, columnId, createData);
      console.log('Created new issue:', newIssue);

      // 상태값에 맞는 칼럼 ID 찾기
      const targetColumnId = getColumnIdForStatus(issueData.status || 'TODO');

      // 새로운 이슈를 해당하는 상태의 칼럼에 추가
      setIssuesByColumn(prev => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), { ...newIssue, columnId }]
      }));

      setIsCreateModalOpen(false);
      // 약간의 지연 후 성공 팝업 표시
      setTimeout(() => {
        setPopup({ type: 'result', payload: { message: '이슈가 생성되었습니다.' } });
      }, 100);

      return { id: newIssue.id };
    } catch (err) {
      console.error('이슈 생성 실패:', err);
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈 생성에 실패했습니다. 서버 오류가 발생했습니다.' }
      });
      throw err;
    }
  };

  const addColumn = async () => {
    if (!canManageProject(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '컬럼을 생성할 권한이 없습니다.' }
      });
      return;
    }

    try {
      /* 추후 적용 예정
      // 현재 칼럼 수 체크
      if (columns.length >= COLUMN_CONSTANTS.MAX_COLUMNS) {
        setPopup({
          type: 'accessDenied',
          payload: { message: `칼럼은 최대 ${COLUMN_CONSTANTS.MAX_COLUMNS}개까지만 생성할 수 있습니다.` }
        });
        return;
      }
      */

      const newColumnTitle = prompt('새 칼럼의 이름을 입력하세요:');
      if (!newColumnTitle) return;

      // 기본 칼럼 이름과 중복 체크
      const defaultColumnTitles = Object.values(COLUMN_CONSTANTS.DEFAULT_COLUMNS).map(col => col.title.toLowerCase());
      if (defaultColumnTitles.includes(newColumnTitle.toLowerCase())) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '기본 칼럼과 동일한 이름은 사용할 수 없습니다.' }
        });
        return;
      }

      // 사용자 정의 칼럼 중복 체크
      const customColumns = columns.filter(col => col.id >= COLUMN_CONSTANTS.CUSTOM_COLUMN_START_ID);
      if (customColumns.some(col => col.title.toLowerCase() === newColumnTitle.toLowerCase())) {
        setPopup({
          type: 'accessDenied',
          payload: { message: '이미 존재하는 칼럼 이름입니다.' }
        });
        return;
      }

      const newColumn = await boardService.createColumn(project.id, newColumnTitle);
      setColumns(prev => [...prev, newColumn]);
      setPopup({ type: 'result', payload: { message: '새 칼럼이 생성되었습니다.' } });
    } catch (err: any) {
      setPopup({
        type: 'accessDenied',
        payload: { message: err.message || '칼럼 생성에 실패했습니다.' }
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // 이슈 이동 권한 체크
    if (!canManageIssues(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 이동할 권한이 없습니다.' }
      });
      return;
    }

    try {
      const sourceColId = parseInt(source.droppableId);
      const destColId = parseInt(destination.droppableId);
      const sourceIssues = [...issuesByColumn[sourceColId]];
      const [movedIssue] = sourceIssues.splice(source.index, 1);

      // 로컬 상태 먼저 업데이트
      if (sourceColId === destColId) {
        // 같은 칼럼 내 이동
        sourceIssues.splice(destination.index, 0, movedIssue);
        setIssuesByColumn({ ...issuesByColumn, [sourceColId]: sourceIssues });

        // 순서 정보만 업데이트
        try {
          await projectService.updateIssue(project.id, movedIssue.id, {
            title: movedIssue.title,
            description: movedIssue.description || '',
            status: movedIssue.status,
            startDate: movedIssue.startDate,
            endDate: movedIssue.endDate,
            assigneeId: movedIssue.assigneeId || ''
          });

          // 순서와 상태 정보 업데이트
          await boardService.updateIssueStatus(
            movedIssue.id,
            movedIssue.status,
            sourceColId,
            destination.index
          );
        } catch (error) {
          console.error('이슈 순서 업데이트 실패:', error);
          loadBoardData(); // 실패 시 데이터 리로드
        }
      } else {
        // 다른 칼럼으로 이동
        const destIssues = [...(issuesByColumn[destColId] || [])];
        destIssues.splice(destination.index, 0, movedIssue);
        setIssuesByColumn({
          ...issuesByColumn,
          [sourceColId]: sourceIssues,
          [destColId]: destIssues,
        });

        // 이슈 상태와 순서 함께 업데이트
        const destColumn = columns.find(col => col.id === destColId);
        if (destColumn) {
          const newStatus = getStatusFromColumnTitle(destColumn.title);
          try {
            await projectService.updateIssue(project.id, movedIssue.id, {
              title: movedIssue.title,
              description: movedIssue.description || '',
              status: newStatus,
              startDate: movedIssue.startDate,
              endDate: movedIssue.endDate,
              assigneeId: movedIssue.assigneeId || ''
            });

            // 순서와 상태 정보 업데이트
            await boardService.updateIssueStatus(
              movedIssue.id,
              newStatus,
              destColId,
              destination.index
            );
          } catch (error) {
            console.error('이슈 상태 및 순서 업데이트 실패:', error);
            loadBoardData(); // 실패 시 데이터 리로드
          }
        }
      }

      // 모든 이슈의 순서 정보 업데이트
      const columnIssues = issuesByColumn[destColId] || [];
      const orderUpdates = columnIssues.map((issue, index) => ({
        issueId: issue.id,
        newOrder: index  // order를 newOrder로 변경
      }));

      if (orderUpdates.length > 0) {
        try {
          await projectService.updateIssueOrders(project.id, orderUpdates, user?.id || 0);
        } catch (error) {
          console.error('이슈 순서 일괄 업데이트 실패:', error);
        }
      }
    } catch (err) {
      console.error('드래그 앤 드롭 처리 실패:', err);
      loadBoardData(); // 에러 발생 시 전체 데이터 다시 로드
    }
  };

  const getStatusFromColumnTitle = (columnTitle: string): string => {
    const title = columnTitle.toLowerCase();
    switch (title) {
      case 'to do':
      case '할 일':
        return 'TODO';
      case 'in progress':
      case '진행 중':
        return 'IN_PROGRESS';
      case 'done':
      case '완료':
        return 'DONE';
      default:
        return title.toUpperCase();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(target)) {
        setMenuOpenColumn(null);
      }
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(target)) {
        setMenuOpenIssue(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumnMenu = (id: number) => {
    setMenuOpenColumn(menuOpenColumn === id ? null : id);
  };

  const getColumnIdForStatus = (status: string): number => {
    const column = columns.find(col => {
      switch (col.title.toLowerCase()) {
        case 'to do':
        case '할 일':
          return status === 'TODO';
        case 'in progress':
        case '진행 중':
          return status === 'IN_PROGRESS';
        case 'done':
        case '완료':
          return status === 'DONE';
        default:
          return col.title.toUpperCase() === status;
      }
    });
    return column ? column.id : columns[0].id; // 해당하는 상태의 칼럼이 없으면 첫 번째 칼럼 사용
  };

  // 댓글 불러오기 함수
  const loadComments = async (issueId: number) => {
    try {
      const data = await commentService.getComments(issueId);
      setComments(data);
    } catch (error) {
      console.error('댓글 목록 로드 실패:', error);
    }
  };

  // 선택된 이슈가 변경될 때 댓글 로드
  useEffect(() => {
    if (selectedIssue) {
      loadComments(selectedIssue.id);
    }
  }, [selectedIssue]);

  // 댓글 작성 핸들러
  const handleSubmitComment = async () => {
    if (!selectedIssue || !newComment.trim()) return;

    try {
      await commentService.createComment(selectedIssue.id, newComment);
      setNewComment('');
      loadComments(selectedIssue.id);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      setPopup({
        type: 'accessDenied',
        payload: { message: '댓글 작성에 실패했습니다.' }
      });
    }
  };

  // 댓글 수정 핸들러
  const handleUpdateComment = async (commentId: number) => {
    if (!selectedIssue || !editCommentContent.trim()) return;

    try {
      await commentService.updateComment(selectedIssue.id, commentId, editCommentContent);
      setEditingCommentId(null);
      setEditCommentContent('');
      loadComments(selectedIssue.id);
      setPopup({ type: 'result', payload: { message: '댓글이 수정되었습니다.' } });
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      setPopup({
        type: 'accessDenied',
        payload: { message: '댓글 수정에 실패했습니다.' }
      });
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: number) => {
    if (!selectedIssue) return;
    
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentService.deleteComment(selectedIssue.id, commentId);
      loadComments(selectedIssue.id);
      setPopup({ type: 'result', payload: { message: '댓글이 삭제되었습니다.' } });
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      setPopup({
        type: 'accessDenied',
        payload: { message: '댓글 삭제에 실패했습니다.' }
      });
    }
  };

  // 댓글 메뉴 클릭 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commentDropdownRef.current && !commentDropdownRef.current.contains(event.target as Node)) {
        setMenuOpenComment(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="project-board-view">
        {columns.map((col, index) => {
          console.log('Rendering column:', col.id, 'with issues:', issuesByColumn[col.id]);
          return (
            <div className="board-column" key={col.id}>
              <div className="board-header">
                <div className="board-title">
                  <span>{col.title}</span>
                  <img src={col.icon} alt={col.title} className="column-icon" />
                </div>
                <div className="menu-container">
                  <button className="add-button" onClick={() => toggleColumnMenu(col.id)}>
                    <img src="/assets/ellipsis.png" alt="menu" />
                  </button>
                  {menuOpenColumn === col.id && (
                    <div className="dropdown-menu" ref={columnDropdownRef}>
                      <button onClick={() => handleColumnEdit(col, '새 제목')}>수정</button>
                      <button className="delete" onClick={() => handleColumnDelete(col.id)}>삭제</button>
                    </div>
                  )}
                </div>
              </div>

              <Droppable droppableId={col.id.toString()}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="droppable-area"
                  >
                    {(issuesByColumn[col.id] || []).map((issue, index) => (
                      <Draggable
                        key={issue.id}
                        draggableId={issue.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="issue-card"
                            onClick={() => setSelectedIssue(issue)}
                          >
                            <div>
                              <div className="issue-title">{issue.title}</div>
                              <div className="issue-due">마감일: {formatDateShort(issue.endDate)}</div>
                              <div className="issue-assignee">담당자: {issue.assigneeId}</div>
                            </div>
                            <div className="menu-container">
                              <button
                                className="card-menu-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenIssue(menuOpenIssue === issue.id ? null : issue.id);
                                }}
                              >
                                <img src="/assets/ellipsis.png" alt="card menu" />
                              </button>
                              {menuOpenIssue === issue.id && (
                                <div className="dropdown-menu" ref={issueDropdownRef} onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => {
                                    setEditingIssue(issue);
                                    setIsEditModalOpen(true);
                                    setMenuOpenIssue(null);
                                  }}>수정</button>
                                  <button className="delete" onClick={() => handleDelete(issue)}>삭제</button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <button className="create-issue-button" onClick={() => {
                if (!canCreateIssue(user, project)) {
                  alert('이슈를 생성할 권한이 없습니다. PM 또는 관리자만 이슈를 생성할 수 있습니다.');
                  return;
                }
                setSelectedColumn(col.id);
                setIsCreateModalOpen(true);
              }}>
                + 이슈 만들기
              </button>
            </div>
          );
        })}
        {canManageProject(user, project) && (
          <button className="add-column-button" onClick={addColumn}>
            <img src="/assets/plus.png" alt="add column" />
          </button>
        )}

        {selectedIssue && (
          <div className="issue-detail-overlay" onClick={() => setSelectedIssue(null)}>
            <div className="issue-detail-panel" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setSelectedIssue(null)}>✕</button>

              {/* 좌측 본문 영역 */}
              <div className="issue-main">
                <div className="issue-header-row">
                  <h2 className="issue-title">[ {selectedIssue.title} ]</h2>
                  <button className="detail-ellipsis"><img src="/assets/ellipsis.png" alt="menu" /></button>
                </div>

                <h4>설명</h4>
                <p>{selectedIssue.description}</p>

                <h4>첨부파일</h4>
                <table className="attachment-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>크기</th>
                      <th>추가된 날짜</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><i className="icon">🖼</i>[이미지 이름].png</td>
                      <td>36 KB</td>
                      <td>2025-03-21 15:21</td>
                      <td><button>⬇</button></td>
                    </tr>
                    <tr>
                      <td><i className="icon">📎</i>[파일 이름].pdf</td>
                      <td>154 KB</td>
                      <td>2025-03-21 15:21</td>
                      <td><button>⬇</button></td>
                    </tr>
                  </tbody>
                </table>

                <h4>댓글</h4>
                <div className="comment-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <div>
                          <strong>{comment.authorId}</strong>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {user?.userId === comment.authorId && (
                          <div className="menu-container">
                            <button
                              className="card-menu-button"
                              onClick={() => setMenuOpenComment(menuOpenComment === comment.id ? null : comment.id)}
                            >
                              <img src="/assets/ellipsis.png" alt="menu" />
                            </button>
                            {menuOpenComment === comment.id && (
                              <div className="dropdown-menu" ref={commentDropdownRef}>
                                <button onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditCommentContent(comment.content);
                                  setMenuOpenComment(null);
                                }}>수정</button>
                                <button 
                                  className="delete"
                                  onClick={() => {
                                    handleDeleteComment(comment.id);
                                    setMenuOpenComment(null);
                                  }}
                                >삭제</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="edit-comment">
                          <textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="comment-edit-input"
                          />
                          <div className="edit-actions">
                            <button onClick={() => handleUpdateComment(comment.id)}>저장</button>
                            <button onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentContent('');
                            }}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <p>{comment.content}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="comment-input-wrapper">
                  <input
                    className="comment-input"
                    placeholder="댓글 작성..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitComment();
                      }
                    }}
                  />
                  <button
                    className="comment-submit-button"
                    onClick={handleSubmitComment}
                  >
                    보내기
                  </button>
                </div>
              </div>

              {/* 우측 사이드 영역 */}
              <div className="issue-sidebar">
                <h4>세부사항</h4>
                <p><strong>담당자:</strong> {selectedIssue.assigneeId}</p>
                <p><strong>상태:</strong> {selectedIssue.status}</p>
                <p><strong>시작일:</strong> {formatDate(selectedIssue.startDate)}</p>
                <p><strong>마감일:</strong> {formatDate(selectedIssue.endDate)}</p>
                <p><strong>보고자:</strong> {selectedIssue.reporterId}</p>
              </div>  
            </div>
          </div>
        )}
        {isEditModalOpen && editingIssue && (
          <IssueEditPopup
            issue={{
              id: editingIssue.id,
              title: editingIssue.title,
              description: editingIssue.description || '',
              status: editingIssue.status || 'TODO',
              start_date: editingIssue.startDate,
              end_date: editingIssue.endDate,
              assignee_id: editingIssue.assigneeId || null,
              assignee_name: editingIssue.assigneeId || ''
            }}
            projectId={project.id}
            projectName={project.name}
            onClose={() => setIsEditModalOpen(false)}
            onSave={async (updated) => {
              try {
                const response = await projectService.updateIssue(project.id, editingIssue.id, {
                  title: updated.title,
                  description: updated.description,
                  status: updated.status,
                  startDate: updated.startDate,
                  endDate: updated.endDate,
                  assigneeId: updated.assigneeId
                });
                
                // 이슈 상태가 변경된 경우 해당하는 칼럼으로 이동
                const targetColumnId = getColumnIdForStatus(updated.status);
                
                setIssuesByColumn(prev => {
                  const updatedColumns = { ...prev };
                  
                  // 모든 칼럼에서 해당 이슈 제거
                  Object.keys(updatedColumns).forEach(colId => {
                    const columnId = parseInt(colId);
                    updatedColumns[columnId] = updatedColumns[columnId].filter((issue: BoardIssue) => 
                      issue.id !== editingIssue.id
                    );
                  });
                  
                  // 새로운 칼럼에 업데이트된 이슈 추가
                  if (!updatedColumns[targetColumnId]) {
                    updatedColumns[targetColumnId] = [];
                  }
                  updatedColumns[targetColumnId].push({
                    ...editingIssue,
                    ...response,
                    columnId: targetColumnId
                  });
                  
                  return updatedColumns;
                });

                setIsEditModalOpen(false);
                setPopup({
                  type: 'result',
                  payload: { message: '이슈가 성공적으로 수정되었습니다.' }
                });
              } catch (error: any) {
                setPopup({
                  type: 'result',
                  payload: { message: error.message || '이슈 수정에 실패했습니다.' }
                });
              }
            }}
          />
        )}
        {isCreateModalOpen && selectedColumn !== null && (
          <IssueCreatePopup
            onClose={() => {
              setIsCreateModalOpen(false);
              setSelectedColumn(null);
            }}
            onCreate={(newIssue) => handleCreateIssue(selectedColumn, newIssue)}
            selectedColumn={selectedColumn.toString()}
            projectId={project.id}
            projectName={project.name}
            initialStatus={columns.find(col => col.id === selectedColumn)?.title.toUpperCase() || 'TODO'}
            setPopup={setPopup}
          />
        )}
        {popup.type === 'accessDenied' && (
          <AccessDeniedPopup
            message={popup.payload?.message || ''}
            onClose={() => setPopup({ type: null })}
          />
        )}
        {popup.type === 'confirmDelete' && (
          <ConfirmPopup
            title="이슈 삭제"
            message={`[ ${popup.payload?.title} ] 이슈를 삭제하시겠습니까?`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setPopup({ type: null })}
          />
        )}
        {popup.type === 'result' && (
          <ResultPopup
            message={popup.payload?.message || ''}
            onClose={() => setPopup({ type: null })}
          />
        )}
      </div>
    </DragDropContext>
  );
};

export default ProjectBoardView;
