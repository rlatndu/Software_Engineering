package com.example.softwareengineering.dto;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueCreateRequest {
    private Long projectId;
    private String title;
    private String status; // TODO, IN_PROGRESS, DONE
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String assigneeId;
    private String reporterId;
    private Integer order; // 우선순위(드래그 순서)
    private Long columnId;  // 이슈가 속할 컬럼 ID
    // 첨부파일, 하위이슈 등은 별도 처리

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
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
    public String getAssigneeId() { return assigneeId; }
    public void setAssigneeId(String assigneeId) { this.assigneeId = assigneeId; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public Long getColumnId() { return columnId; }
    public void setColumnId(Long columnId) { this.columnId = columnId; }
} 