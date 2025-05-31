package com.example.softwareengineering.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recent_works")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentWork {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    private Issue issue;

    @Column(name = "action_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    @Column(name = "activity_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ActivityType activityType;

    @Column(name = "page_name", length = 100)
    private String pageName;

    @Column(name = "content", length = 500)
    private String content;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status")
    private String newStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // 30일 후 만료
        expiryDate = createdAt.plusDays(30);
    }

    public enum ActionType {
        CREATE("생성"),
        UPDATE("수정"),
        DELETE("삭제"),
        STATUS_CHANGE("상태 변경"),
        PAGE_MOVE("페이지 이동"),
        COMMENT("댓글");

        private final String description;

        ActionType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum ActivityType {
        ISSUE,
        COMMENT,
        PAGE_NAVIGATION
    }

    public String getFormattedDescription() {
        switch (activityType) {
            case ISSUE:
                if (actionType == ActionType.STATUS_CHANGE) {
                    return String.format("%s 변경 - %s", newStatus, issue.getTitle());
                } else {
                    return String.format("이슈 %s - %s", actionType.getDescription(), issue.getTitle());
                }
            case COMMENT:
                return String.format("댓글%s - %s", actionType.getDescription(), content);
            case PAGE_NAVIGATION:
                return String.format("페이지 이동 - %s", pageName);
            default:
                return "알 수 없는 활동";
        }
    }
} 