package com.example.softwareengineering.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueResponse {
    private Long id;
    private String title;
    private String status;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String assigneeId;
    private String assigneeName;
    private String reporterId;
    private String reporterName;
    private Long projectId;
    private String projectName;
    private Integer order;
    private LocalDateTime createdAt;
    private List<AttachmentResponse> attachments;
} 