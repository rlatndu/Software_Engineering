import React, { useState, useRef, useEffect } from 'react';
import IssueEditPopup from './IssueEditPopup';
import './ProjectBoardView.css';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import AccessDeniedPopup from '../../components/AccessDeniedPopup';
import ConfirmPopup from '../../components/ConfirmPopup';
import ResultPopup from '../../components/ResultPopup';
import IssueCreatePopup from './IssueCreatePopup';
import boardService, { Column as BoardColumn, Issue as BoardIssue, DEFAULT_COLUMNS, COLUMN_CONSTANTS } from '../../api/boardService';
import { canManageProject, canManageIssues, canCreateIssue } from '../../utils/permissionUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/project';
import commentService from '../../api/commentService';

interface ProjectBoardViewProps {
  project: Project;
}

const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({ project }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [issuesByColumn, setIssuesByColumn] = useState<{ [columnId: number]: BoardIssue[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popup, setPopup] = useState<{
    type: 'accessDenied' | 'confirmDelete' | 'result' | null;
    payload?: any;
  }>({ type: null });

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [menuOpenComment, setMenuOpenComment] = useState<number | null>(null);
  const commentDropdownRef = useRef<HTMLDivElement>(null);

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
      setPopup({ type: 'result', payload: { message: '수정되었습니다.' } });
    } catch (err) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈 수정에 실패했습니다.' }
      });
    }
  };

  const handleDelete = (issue: BoardIssue) => {
    setMenuOpenIssue(null);
    setPopup({ type: 'confirmDelete', payload: issue });
  };

  const handleConfirmDelete = async () => {
    if (!popup.payload) return;
    
    const issue = popup.payload;
    setPopup({ type: null });

    try {
      await boardService.deleteIssue(issue.id, project.id);
      setIssuesByColumn(prev => {
          const updated = { ...prev };
          for (const colId in updated) {
          updated[colId] = updated[colId].filter(i => i.id !== issue.id);
          }
          return updated;
        });
        setPopup({ type: 'result', payload: { message: '삭제되었습니다.' } });
    } catch (err: any) {
        setPopup({
          type: 'accessDenied',
          payload: {
            message: err.response?.data?.message || `이슈 삭제에 실패했습니다.`,
          },
        });
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
      return;
    }

    try {
      // 칼럼 ID에 따른 상태 설정
      const column = columns.find(col => col.id === columnId);
      if (!column) {
        throw new Error('선택된 칼럼을 찾을 수 없습니다.');
      }

      let status;
      switch (column.title) {
        case '할 일':
          status = 'TODO';
          break;
        case '진행 중':
          status = 'IN_PROGRESS';
          break;
        case '완료':
          status = 'DONE';
          break;
        default:
          status = column.title.toUpperCase();
      }

      const createData = {
        ...issueData,
        status: status,
        columnId: columnId,
        projectId: project.id,
        reporterId: user?.userId,
        startDate: issueData.startDate || new Date().toISOString(),
        endDate: issueData.endDate || new Date().toISOString()
      };

      console.log('Creating issue with data:', createData);

      const newIssue = await boardService.createIssue(project.id, columnId, createData);

      console.log('Created new issue:', newIssue);

      setIsCreateModalOpen(false);
      setPopup({ type: 'result', payload: { message: '이슈가 생성되었습니다.' } });

      // 보드 데이터 다시 로드
      await loadBoardData();
    } catch (err) {
      console.error('이슈 생성 실패:', err);
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈 생성에 실패했습니다. 서버 오류가 발생했습니다.' }
      });
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
    const { source, destination, type } = result;
    if (!destination) return;

    // 드래그 앤 드롭 권한 체크
    if (type === 'column' && !canManageProject(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '컬럼 순서를 변경할 권한이 없습니다.' }
      });
      return;
    }

    if (type === 'issue' && !canManageIssues(user, project)) {
      setPopup({
        type: 'accessDenied',
        payload: { message: '이슈를 이동할 권한이 없습니다.' }
      });
      return;
    }

    try {
      if (type === 'column') {
        const newColumns = Array.from(columns);
        const [movedColumn] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, movedColumn);
        
        setColumns(newColumns);
        await boardService.updateColumnsOrder(
          project.id,
          newColumns.map(col => col.id)
        );
        return;
      }

      const sourceColId = parseInt(source.droppableId);
      const destColId = parseInt(destination.droppableId);
      const sourceIssues = [...issuesByColumn[sourceColId]];
      const [movedIssue] = sourceIssues.splice(source.index, 1);

      if (sourceColId === destColId) {
        sourceIssues.splice(destination.index, 0, movedIssue);
        setIssuesByColumn({ ...issuesByColumn, [sourceColId]: sourceIssues });
      } else {
        const destIssues = [...(issuesByColumn[destColId] || [])];
        destIssues.splice(destination.index, 0, movedIssue);
        setIssuesByColumn({
          ...issuesByColumn,
          [sourceColId]: sourceIssues,
          [destColId]: destIssues,
        });
      }

      // 이슈 이동 API 호출
      await boardService.moveIssue(
        movedIssue.id,
        destColId,
        destination.index
      );
    } catch (err) {
      console.error('드래그 앤 드롭 처리 실패:', err);
      // 에러 발생 시 원래 상태로 복구하기 위해 데이터 다시 로드
      loadBoardData();
    }
  };
  
  const [selectedIssue, setSelectedIssue] = useState<BoardIssue | null>(null);
  const [menuOpenColumn, setMenuOpenColumn] = useState<number | null>(null);
  const [menuOpenIssue, setMenuOpenIssue] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<BoardIssue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const issueDropdownRef = useRef<HTMLDivElement>(null);

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
      switch (col.title) {
        case '할 일':
          return status === 'TODO';
        case '진행 중':
          return status === 'IN_PROGRESS';
        case '완료':
          return status === 'DONE';
        default:
          return col.title.toUpperCase() === status;
      }
    });
    return column?.id || columns[0]?.id;
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
      <Droppable droppableId="board" direction="horizontal" type="column">
        {(provided) => (
          <div className="project-board-view" ref={provided.innerRef} {...provided.droppableProps}>
            {columns.map((col, index) => {
              console.log('Rendering column:', col.id, 'with issues:', issuesByColumn[col.id]);
              return (
                <Draggable draggableId={col.id.toString()} index={index} key={col.id}>
                  {(provided) => (
                    <div
                      className="board-column"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
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

                      <Droppable droppableId={col.id.toString()} type="issue">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="droppable-area">
                            {(issuesByColumn[col.id] || []).map((issue, index) => (
                              <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    className="issue-card"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedIssue(issue)}
                                  >
                                    <div>
                                      <div className="issue-title">{issue.title}</div>
                                      <div className="issue-due">마감일: {issue.endDate}</div>
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
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
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
                      <p><strong>시작일:</strong> {selectedIssue.startDate}</p>
                      <p><strong>마감일:</strong> {selectedIssue.endDate}</p>
                      <p><strong>보고자:</strong> {selectedIssue.reporterId}</p>
                    </div>  
                  </div>
                </div>
              )}
          </div>
        )}
      </Droppable>
      {isEditModalOpen && editingIssue && (
        <IssueEditPopup
          issue={{
            id: editingIssue.id,
            title: editingIssue.title,
            description: editingIssue.description || ''
          }}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingIssue(null);
          }}
          onSave={async (updatedIssue) => {
            try {
              const result = await boardService.updateIssue(updatedIssue.id, {
                ...editingIssue,
                ...updatedIssue,
                projectId: project.id
              });
              setIssuesByColumn(prev => {
                const updated = { ...prev };
                for (const colId in updated) {
                  updated[colId] = updated[colId].map(issue =>
                    issue.id === result.id ? result : issue
                  );
                }
                return updated;
              });
              setIsEditModalOpen(false);
              setEditingIssue(null);
              setPopup({ type: 'result', payload: { message: '이슈가 수정되었습니다.' } });
            } catch (err) {
              setPopup({
                type: 'accessDenied',
                payload: { message: '이슈 수정 권한이 없습니다.' }
              });
            }
          }}
        />
      )}
      {popup.type === 'accessDenied' && (
  <AccessDeniedPopup
    message={popup.payload.message}
    onClose={() => setPopup({ type: null })}
  />
)}

{popup.type === 'confirmDelete' && (
  <ConfirmPopup
    title="정말 이 이슈를 삭제하시겠습니까?"
    message={popup.payload.title}
    onConfirm={handleConfirmDelete}
    onCancel={() => setPopup({ type: null })}
  />
)}

{popup.type === 'result' && (
  <ResultPopup
    message={popup.payload.message}
    onClose={() => setPopup({ type: null })}
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
    initialStatus={(() => {
      const column = columns.find(col => col.id === selectedColumn);
      if (!column) return 'TODO';
      
      switch (column.title) {
        case '할 일':
          return 'TODO';
        case '진행 중':
          return 'IN_PROGRESS';
        case '완료':
          return 'DONE';
        default:
          return column.title.toUpperCase();
      }
    })()}
  />
)}

    </DragDropContext>
  );
};

export default ProjectBoardView;
