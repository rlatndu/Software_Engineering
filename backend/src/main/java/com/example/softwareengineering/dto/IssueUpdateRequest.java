package com.example.softwareengineering.dto;

import java.time.LocalDateTime;

public class IssueUpdateRequest {
    private String title;
    private String status;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long assigneeId; // 담당자 변경 시 사용
    private Integer order;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
} 