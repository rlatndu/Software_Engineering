package com.example.softwareengineering.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs",
       indexes = {
           @Index(name = "idx_activity_log_user", columnList = "user_id"),
           @Index(name = "idx_activity_log_project", columnList = "project_id"),
           @Index(name = "idx_activity_log_timestamp", columnList = "timestamp")
       })
@Getter @Setter
@NoArgsConstructor
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    private Long issueId;
    private Long commentId;
    private String targetPage;
    private String statusChange;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
} 