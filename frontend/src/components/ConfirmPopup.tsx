const ConfirmPopup = ({ title, message, onConfirm, onCancel }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm}>삭제</button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  );

  export default ConfirmPopup;
