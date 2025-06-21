package com.example.softwareengineering.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(nullable = false)
    private IssueStatus status;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;

    @Column(name = "order_index", nullable = false)
    @Comment("칼럼 간 이동 시 사용되는 전역 순서")
    private Integer orderIndex;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserIssueOrder> userOrders = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IssueComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IssueAttachment> attachments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_status_id")
    private CustomIssueStatus customStatus;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = IssueStatus.TODO;
        if (orderIndex == null) orderIndex = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 전역 순서 (칼럼 간 이동 시 사용)
     */
    public Integer getOrder() {
        return orderIndex;
    }

    public void setOrder(Integer order) {
        this.orderIndex = order;
    }

    /**
     * 특정 사용자의 이슈 순서 조회
     */
    public Integer getUserOrder(User user) {
        return userOrders.stream()
            .filter(uo -> uo.getUser().getId().equals(user.getId()))
            .findFirst()
            .map(UserIssueOrder::getOrderIndex)
            .orElse(this.orderIndex);
    }

    /**
     * 특정 사용자의 이슈 순서 설정
     */
    public void setUserOrder(User user, Integer order) {
        UserIssueOrder userOrder = userOrders.stream()
            .filter(uo -> uo.getUser().getId().equals(user.getId()))
            .findFirst()
            .orElse(null);

        if (userOrder == null) {
            userOrder = UserIssueOrder.builder()
                .user(user)
                .issue(this)
                .column(this.column)
                .orderIndex(order)
                .build();
            userOrders.add(userOrder);
        } else {
            userOrder.setOrderIndex(order);
        }
    }
} 