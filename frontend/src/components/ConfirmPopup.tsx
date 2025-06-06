import './ConfirmPopup.css';

const ConfirmPopup = ({ title, message, onConfirm, onCancel }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div className="ac-popup-overlay">
      <div className="ac-popup-content">
        <h3>{title}</h3>
        <p className="ac-message">{message}</p>
        <img src="/assets/icon_logo_hing.png" alt="sad" style={{ width: '80px' }} />
        <div className="ac-button-group">
          <button className="ac-button" onClick={onCancel}>취소</button>
          <button className="ac-button delete" onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  );

  export default ConfirmPopup;
