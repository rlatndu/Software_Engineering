package com.example.softwareengineering.dto;

public class IssueOrderUpdateRequest {
    private Long issueId;
    private Integer order;

    public Long getIssueId() { return issueId; }
    public void setIssueId(Long issueId) { this.issueId = issueId; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
} 