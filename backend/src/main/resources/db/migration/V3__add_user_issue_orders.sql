CREATE TABLE user_issue_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    issue_id BIGINT NOT NULL,
    column_id BIGINT NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (issue_id) REFERENCES issues(id),
    FOREIGN KEY (column_id) REFERENCES board_columns(id),
    UNIQUE KEY unique_user_issue (user_id, issue_id)
); 