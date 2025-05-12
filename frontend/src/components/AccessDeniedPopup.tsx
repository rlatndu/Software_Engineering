import './AccessDeniedPopup.css'

const AccessDeniedPopup = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>접근 권한 안내</h3>
        <img src="/assets/icon_logo_hing.png" alt="sad" style={{ width: '80px' }} />
        <p>{message}</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
  
  export default AccessDeniedPopup;
