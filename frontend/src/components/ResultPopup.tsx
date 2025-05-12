const ResultPopup = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="popup-overlay">
      <div className="popup-content">
        <p>{message}</p>
        <button onClick={onClose}>확인</button>
      </div>
    </div>
  );

export default ResultPopup;
