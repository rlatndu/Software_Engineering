-- 기존 테이블 백업
CREATE TABLE activity_logs_backup AS SELECT * FROM activity_logs;

-- 기존 테이블 삭제
DROP TABLE IF EXISTS activity_logs;

-- 새로운 테이블 생성
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    timestamp DATETIME NOT NULL,
    issue_id BIGINT,
    comment_id BIGINT,
    target_page VARCHAR(255),
    status_change VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES project(id)
);

-- 백업 데이터 복원
INSERT INTO activity_logs (
    id, user_id, project_id, type, title, content,
    timestamp, issue_id, comment_id, target_page, status_change
)
SELECT 
    id, user_id, project_id, type, title, content,
    timestamp, issue_id, comment_id, target_page, status_change
FROM activity_logs_backup;

-- 백업 테이블 삭제
DROP TABLE activity_logs_backup; 