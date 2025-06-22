package com.example.softwareengineering.dto;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueUpdateRequest {
    private String title;
    private String description;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer order;
    private String assigneeId;
    private Long columnId;
} 