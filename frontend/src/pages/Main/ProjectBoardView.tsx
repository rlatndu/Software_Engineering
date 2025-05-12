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

interface Project {
  id: number;
  name: string;
}

interface ProjectBoardViewProps {
  project: Project;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  start_date: string;
  end_date: string;
  assignee_id: number;
  assignee_name?: string;
}

const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({ project }) => {
  const [columns, setColumns] = useState([
    { id: 1, title: 'To Do', icon: '/assets/todo.png' },
    { id: 2, title: 'In Progress', icon: '/assets/inprogress.png' },
    { id: 3, title: 'Done', icon: '/assets/done.png' },
  ]);

  const [issuesByColumn, setIssuesByColumn] = useState<{ [columnId: number]: Issue[] }>({
    1: [
      {
        id: 101,
        title: '첫 번째 할 일',
        description: '로그인 기능 구현 필요...\nsdg',
        status: 'TODO',
        start_date: '2025-05-01',
        end_date: '2025-05-15',
        assignee_id: 1,
        assignee_name: '김유저',
      },
      {
        id: 102,
        title: 'ㅇㅅ 번째 할 일',
        description: '로그인 기능 구현 필요...\nsdg',
        status: 'TODO',
        start_date: '2025-05-01',
        end_date: '2025-05-15',
        assignee_id: 1,
        assignee_name: '김유저',
      },
    ],
    2: [{
      id: 103,
      title: '두 번째 할 일',
      description: '로그인 기능ㄴㅇㄹㄹ 구현 필요...\nsdg',
      status: 'TODO',
      start_date: '2025-05-01',
      end_date: '2025-05-15',
      assignee_id: 1,
      assignee_name: '김유저',
    },],
    3: [],
  });

  const [popup, setPopup] = useState<{
    type: 'accessDenied' | 'confirmDelete' | 'result' | null;
    payload?: any;
  }>({ type: null });

  const currentUserId = 99;

  const handleEdit = (issue: Issue) => {
    setMenuOpenIssue(null);
    if (issue.assignee_id !== currentUserId) {
      setPopup({
        type: 'accessDenied',
        payload: {
          message: `[ ${issue.title} ] 담당자가 아닙니다.\n해당 이슈 담당자만 수정하실 수 있습니다.`,
        },
      });
    } else {
      setEditingIssue(issue);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (issue: Issue) => {
    setMenuOpenIssue(null);
    setPopup({ type: 'confirmDelete', payload: issue });
  };

  const handleConfirmDelete = () => {
    const issue = popup.payload;
    const hasPermission = false;
    setPopup({ type: null });
    setTimeout(() => {
      if (hasPermission) {
        setIssuesByColumn((prev) => {
          const updated = { ...prev };
          for (const colId in updated) {
            updated[colId] = updated[colId].filter((i) => i.id !== issue.id);
          }
          return updated;
        });
        setPopup({ type: 'result', payload: { message: '삭제되었습니다.' } });
      }
      else {
        setPopup({
          type: 'accessDenied',
          payload: {
            message: `[ ${issue.title} ] 삭제 권한이 없습니다. 프로젝트 관리자만 삭제하실 수 있습니다.`,
          },
        });
      }
    }, 10);
  };

  const getColumnIdForStatus = (status: string): number => {
    switch (status) {
      case 'TODO':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'DONE':
        return 3;
      default:
        return 1;
    }
  };
  
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [menuOpenColumn, setMenuOpenColumn] = useState<number | null>(null);
  const [menuOpenIssue, setMenuOpenIssue] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


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

  const addColumn = () => {
    const newColumn = {
      id: Date.now(),
      title: 'New Column',
      icon: '/assets/plus.png',
    };
    setColumns([...columns, newColumn]);
  };

  const toggleColumnMenu = (id: number) => {
    setMenuOpenColumn(menuOpenColumn === id ? null : id);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'column') {
      const newColumns = Array.from(columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      setColumns(newColumns);
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
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" direction="horizontal" type="column">
        {(provided) => (
          <div className="project-board-view" ref={provided.innerRef} {...provided.droppableProps}>
            {columns.map((col, index) => (
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
                      <button className="add-button" onClick={() => toggleColumnMenu(col.id)}>
                        <img src="/assets/ellipsis.png" alt="menu" />
                      </button>
                      {menuOpenColumn === col.id && (
                      <div className="dropdown-menu issue-dropdown-menu" ref={issueDropdownRef}>
                        <button className="dropdown-edit-button">수정</button>
                        <button className="dropdown-delete-button">삭제</button>
                      </div>
                      
                      )}
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
                                    <div className="issue-due">마감일: {issue.end_date}</div>
                                  </div>
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
                                    <div className="dropdown-menu issue-dropdown-menu" ref={issueDropdownRef} onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => handleEdit(issue)}>수정</button>
                                      <button onClick={() => handleDelete(issue)}>삭제</button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    <button className="create-issue-button" onClick={() => setIsCreateModalOpen(true)}>
                      + 이슈 만들기
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <button className="add-column-button" onClick={addColumn}>
              <img src="/assets/plus.png" alt="add column" />
            </button>

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
                      <div className="comment">
                        <strong>[댓글 작성자 ID]</strong> <span className="comment-date">작성 날짜</span>
                        <p>[댓글 내용 주저리주저리]</p>
                      </div>
                    </div>
                    <div className="comment-input-wrapper">
                      <input className="comment-input" placeholder="댓글 작성..." />
                      <button className="comment-submit-button">보내기</button>
                    </div>
                  </div>

                  {/* 우측 사이드 영역 */}
                  <div className="issue-sidebar">
                    <h4>세부사항</h4>
                    <p><strong>담당자:</strong> {selectedIssue.assignee_name}</p>
                    <p><strong>상태:</strong> {selectedIssue.status}</p>
                    <p><strong>시작일:</strong> {selectedIssue.start_date}</p>
                    <p><strong>마감일:</strong> {selectedIssue.end_date}</p>
                    <p><strong>보고자:</strong> 보고자 ID</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
      {isEditModalOpen && editingIssue && (
        <IssueEditPopup
          issue={editingIssue}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            setIssuesByColumn(prev => {
              const updatedColumns = { ...prev };
              for (const colId in updatedColumns) {
                updatedColumns[colId] = updatedColumns[colId].map(issue =>
                  issue.id === updated.id ? { ...issue, ...updated } : issue
                );
              }
              return updatedColumns;
            });
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

{isCreateModalOpen && (
  <IssueCreatePopup
    onClose={() => setIsCreateModalOpen(false)}
    onCreate={(newIssue) => {
      const targetColId = getColumnIdForStatus(newIssue.status); // 상태에 맞는 칼럼 ID 매핑 함수 필요
      setIssuesByColumn(prev => ({
        ...prev,
        [targetColId]: [...(prev[targetColId] || []), newIssue],
      }));
      setIsCreateModalOpen(false);
    }}
  />
)}

    </DragDropContext>
  );
};

export default ProjectBoardView;
