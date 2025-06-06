import './ResultPopup.css';

const ResultPopup = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="ac-popup-overlay">
    <div className="ac-popup-content">
      <h3>알림</h3>
      <img src="/assets/icon_logo.png" alt="success" style={{ width: '80px' }} />
      <p className="ac-message">{message}</p>
      <button onClick={onClose} className="ac-button">확인</button>
    </div>
  </div>
);

export default ResultPopup;
