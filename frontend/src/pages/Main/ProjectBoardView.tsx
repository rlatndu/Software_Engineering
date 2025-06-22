import React, { useState, useRef, useEffect } from 'react';
import IssueEditPopup from './IssueEditPopup';
import './ProjectBoardView.css';
import AccessDeniedPopup from '../../components/AccessDeniedPopup';
import ConfirmPopup from '../../components/ConfirmPopup';
import ResultPopup from '../../components/ResultPopup';
import IssueCreatePopup from './IssueCreatePopup';
import boardService, { Column as BoardColumn, Issue as BoardIssue, DEFAULT_COLUMNS, COLUMN_CONSTANTS } from '../../api/boardService';
import { canManageProject, canManageIssues, canCreateIssue, canMoveIssueWithinColumn, canMoveIssueBetweenColumns } from '../../utils/permissionUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/project';
import { UserRole } from '../../types/role';
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
  const { user, updateUserRoles } = useAuth();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [issuesByColumn, setIssuesByColumn] = useState<{ [columnId: number]: BoardIssue[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>({ type: null });
  const [permissionChecked, setPermissionChecked] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [menuOpenComment, setMenuOpenComment] = useState<number | null>(null);
  const commentDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedIssue, setSelectedIssue] = useState<BoardIssue | null>(null);
  const [menuOpenIssue, setMenuOpenIssue] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<BoardIssue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  const issueDropdownRef = useRef<HTMLDivElement>(null);

  // 권한 캐시 상태 추가
  const [canMoveWithin, setCanMoveWithin] = useState<boolean>(false);
  const [canMoveBetween, setCanMoveBetween] = useState<boolean>(false);

  useEffect(() => {
    if (user && project) {
      const projectRole = user.roles.projectRoles[project.id];
      setCanMoveWithin(projectRole !== undefined);
      setCanMoveBetween(
        user.roles.siteRole === UserRole.ADMIN ||
        projectRole === UserRole.PM ||
        projectRole === UserRole.ADMIN
      );
    }
  }, [user, project]);

  useEffect(() => {
    const initializeBoard = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 모든 데이터를 병렬로 로드
        const [members, columnsData, issuesData] = await Promise.all([
          projectService.getProjectMembers(project.id),
          boardService.getColumns(project.id),
          boardService.getIssues(project.id),
          updateUserRoles(project.siteId, project.id)
        ]);
        
        const userMember = members.find(member => member.userId === user.userId);
        if (!userMember && project.isPrivate) {
          setPopup({
            type: 'accessDenied',
            payload: { message: '비공개 프로젝트입니다. 프로젝트 멤버만 접근할 수 있습니다.' }
          });
          return;
        }

        setPermissionChecked(true);

        // 컬럼과 이슈 데이터 설정
        if (columnsData && columnsData.length > 0) {
          const sortedColumns = [...columnsData].sort((a, b) => a.order - b.order);
          setColumns(sortedColumns);
        }

        const initialIssuesByColumn: { [key: number]: BoardIssue[] } = {};
        columnsData.forEach(col => {
          initialIssuesByColumn[col.id] = issuesData[col.id] || [];
        });

        setIssuesByColumn(initialIssuesByColumn);
        
      } catch (err) {
        console.error('보드 초기화 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initializeBoard();
  }, [project.id, project.siteId, user]);

  // 권한 캐시 상태 업데이트
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(event.target as Node)) {
        setMenuOpenIssue(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getColumnIcon = (columnTitle: string): string => {
    const title = columnTitle.toLowerCase();
    switch (title) {
      case 'to do':
      case '할 일':
        return '/assets/todo.png';
      case 'in progress':
      case '진행 중':
        return '/assets/inprogress.png';
      case 'done':
      case '완료':
        return '/assets/done.png';
      case 'hold':
      case '보류':
        return '/assets/hold.png';
      default:
        return '/assets/custom-column.png';
    }
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

  const handleEditClick = (issue: BoardIssue) => {
    if (!canManageIssues(user, project) && (!issue.assigneeId || String(issue.assigneeId) !== user?.userId)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 수정할 권한이 없습니다.\n프로젝트 관리자, 프로젝트 PM, 또는 해당 이슈의 담당자만 수정할 수 있습니다.' }
      });
      return;
    }

    setEditingIssue(issue);
    setIsEditModalOpen(true);
  };

  const handleDelete = (issue: BoardIssue) => {
    if (!canManageIssues(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 삭제할 권한이 없습니다.\n프로젝트 관리자 또는 프로젝트 PM만 삭제할 수 있습니다.' }
      });
      return;
    }

    setPopup({
      type: 'confirmDelete',
      payload: {
        id: issue.id,
        title: issue.title
      }
    });
    setMenuOpenIssue(null);
  };

  const handleConfirmDelete = async () => {
    if (!popup.payload?.id) return;

    try {
      await boardService.deleteIssue(project.id, popup.payload.id);
      setIssuesByColumn(prev => {
        const updated = { ...prev };
        for (const colId in updated) {
          updated[colId] = updated[colId].filter(issue => issue.id !== popup.payload?.id);
        }
        return updated;
      });
      setPopup({ type: 'result', payload: { message: '이슈가 삭제되었습니다.' } });
    } catch (err: any) {
      setPopup({
        type: 'accessDenied',
        payload: { message: err.message || '이슈 삭제에 실패했습니다.' }
      });
    }
  };

  const handleCreateButtonClick = (columnId: number) => {
    if (!canManageIssues(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 생성할 권한이 없습니다.\n프로젝트 관리자 또는 프로젝트 PM만 이슈를 생성할 수 있습니다.' }
      });
      return;
    }
    setSelectedColumn(columnId);
    setIsCreateModalOpen(true);
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
      const normalizedStatus = issueData.status?.replace(/[_\s]/g, '').toUpperCase();
      const targetColumn = columns.find(col => 
        col.title.replace(/[_\s]/g, '').toUpperCase() === normalizedStatus
      );

      const targetColumnId = targetColumn ? targetColumn.id : columnId;

      const createData = {
        ...issueData,
        columnId: targetColumnId,
        projectId: project.id,
        reporterId: user?.userId,
        startDate: issueData.startDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
        endDate: issueData.endDate || new Date(new Date().setHours(23, 59, 59, 999) - new Date().getTimezoneOffset() * 60000).toISOString()
      };

      const newIssue = await boardService.createIssue(project.id, targetColumnId, createData);

      setIssuesByColumn(prev => ({
        ...prev,
        [targetColumnId]: [...(prev[targetColumnId] || []), { 
          ...newIssue, 
          columnId: targetColumnId,
          order: prev[targetColumnId] ? prev[targetColumnId].length : 0
        }]
      }));

      setIsCreateModalOpen(false);
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

  // 권한 체크 함수 추가
  const checkMovePermission = (issue: BoardIssue, isBetweenColumns: boolean): boolean => {
    if (!user) return false;

    // 사이트 ADMIN은 모든 권한 있음
    if (user.roles.siteRole === UserRole.ADMIN) return true;

    const projectRole = user.roles.projectRoles[project.id];
    
    // PM/ADMIN은 모든 권한 있음
    if (projectRole === UserRole.PM || projectRole === UserRole.ADMIN) return true;

    // 이슈 담당자 체크
    const isAssignee = Boolean(issue.assigneeId && 
      String(issue.assigneeId) === String(user.userId));

    // 같은 칼럼 내 이동
    if (!isBetweenColumns) {
      return Boolean(projectRole !== undefined || isAssignee);
    }
    
    // 다른 칼럼으로 이동
    return isAssignee;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColId = parseInt(source.droppableId);
    const destColId = parseInt(destination.droppableId);
    
    const currentState = { ...issuesByColumn };
    
    try {
      const sourceIssues = [...issuesByColumn[sourceColId]];
      const [movedIssue] = sourceIssues.splice(source.index, 1);
      const isBetweenColumns = sourceColId !== destColId;

      // 권한 체크
      const hasPermission = checkMovePermission(movedIssue, isBetweenColumns);
      if (!hasPermission) {
        const message = isBetweenColumns
          ? '이슈를 다른 칼럼으로 이동할 권한이 없습니다. 프로젝트 관리자, 프로젝트 PM, 또는 해당 이슈의 담당자만 가능합니다.'
          : '이슈를 이동할 권한이 없습니다. 프로젝트 멤버 또는 이슈 담당자만 이슈를 이동할 수 있습니다.';
        
        setPopup({
          type: 'accessDenied',
          payload: { message }
        });
        setIssuesByColumn(currentState);
        return;
      }

      if (sourceColId === destColId) {
        sourceIssues.splice(destination.index, 0, movedIssue);
        setIssuesByColumn({ ...issuesByColumn, [sourceColId]: sourceIssues });

        try {
          const validIssues = sourceIssues.filter(issue => issue && issue.id);
          if (validIssues.length !== sourceIssues.length) {
            throw new Error('유효하지 않은 이슈가 포함되어 있습니다.');
          }
          
          const orderUpdates = validIssues.map((issue, index) => ({
            issueId: issue.id,
            order: (index + 1) * 1000
          }));

          if (user && orderUpdates.length > 0) {
            await projectService.updateIssueOrders(project.id, orderUpdates, user.id);
          }
        } catch (error) {
          console.error('이슈 순서 업데이트 실패:', error);
          throw error;
        }
      } else {
        const destIssues = [...(issuesByColumn[destColId] || [])];
        destIssues.splice(destination.index, 0, movedIssue);
        
        const newIssuesByColumn = {
          ...issuesByColumn,
          [sourceColId]: sourceIssues,
          [destColId]: destIssues
        };
        setIssuesByColumn(newIssuesByColumn);

        const column = columns.find(col => col.id === destColId);
        if (!column) throw new Error('칼럼을 찾을 수 없습니다.');

        const sourceOrderUpdates = sourceIssues.map((issue, index) => ({
          issueId: issue.id,
          order: (index + 1) * 1000
        }));

        const destOrderUpdates = destIssues.map((issue, index) => ({
          issueId: issue.id,
          order: (index + 1) * 1000
        }));

        if (user) {
          await projectService.updateIssueOrders(project.id, [...sourceOrderUpdates, ...destOrderUpdates], user.id);

          await projectService.updateIssue(project.id, movedIssue.id, {
            title: movedIssue.title,
            description: movedIssue.description || '',
            status: getStatusFromColumnTitle(column.title),
            startDate: movedIssue.startDate,
            endDate: movedIssue.endDate,
            assigneeId: movedIssue.assigneeId || ''
          });
        }
      }
    } catch (error) {
      console.error('이슈 이동 중 오류 발생:', error);
      setIssuesByColumn(currentState);
      setPopup({
        type: 'result',
        payload: { message: '이슈 이동 중 오류가 발생했습니다.' }
      });
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
      case 'hold':
      case '보류':
        return 'HOLD';
      default:
        return columnTitle.toUpperCase().replace(/\s+/g, '_');
    }
  };

  // status(예: 'TODO')로 칼럼 찾기
  const findColumnByStatus = (status: string) => {
    return columns.find(col => getStatusFromColumnTitle(col.title) === status);
  };

  const handleEdit = async (updated: any) => {
    if (!user || !editingIssue) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const response = await projectService.updateIssue(project.id, editingIssue.id, {
        title: updated.title,
        description: updated.description || '',
        status: updated.status || 'TODO',
        startDate: updated.start_date,
        endDate: updated.end_date,
        assigneeId: updated.assignee_id || ''
      });
      
      // 이슈 상태가 변경된 경우 해당하는 칼럼으로 이동
      const targetColumn = findColumnByStatus(updated.status);
      if (!targetColumn) {
        throw new Error('해당하는 칼럼을 찾을 수 없습니다.');
      }
      const targetColumnId = targetColumn.id;
      
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
  };

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
                  <img src={getColumnIcon(col.title)} alt={col.title} className="column-icon" />
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
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(issue);
                                    setMenuOpenIssue(null);
                                  }}>수정</button>
                                  <button className="delete" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(issue);
                                  }}>삭제</button>
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
              <button className="create-issue-button" onClick={() => handleCreateButtonClick(col.id)}>
                + 이슈 만들기
              </button>
            </div>
          );
        })}

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
              assignee_id: editingIssue.assigneeId ? String(editingIssue.assigneeId) : null,
              assignee_name: ''
            }}
            projectId={project.id}
            projectName={project.name}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingIssue(null);
            }}
            onSave={handleEdit}
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
