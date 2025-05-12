interface EditModalProps {
    type: 'issue' | 'project' | 'user'; // 필요시 확장
    data: any; // 실제 타입 정의 가능
    onSave: (updatedData: any) => void;
    onClose: () => void;
  }
  
const EditModal: React.FC<EditModalProps> = ({ type, data, onSave, onClose }) => {
if (type === 'issue') {
    return (
    <div className="popup-overlay">
        <div className="edit-modal">
        <h2>이슈 수정</h2>
        {/* 기존 IssueEditPopup 형태 삽입 */}
        {/* ...내용 생략 */}
        <button onClick={() => onSave({ ...data, title: '변경됨' })}>저장</button>
        <button onClick={onClose}>취소</button>
        </div>
    </div>
    );
}

// 다른 타입: 'project', 'user' 등도 이곳에서 분기 가능
return null;
};

export default EditModal;


  