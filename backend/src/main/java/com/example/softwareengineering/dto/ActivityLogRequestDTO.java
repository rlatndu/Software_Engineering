package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.ActivityType;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ActivityLogRequestDTO {
    private Long userId;
    private ActivityType type;
    private String title;
    private String content;
    private Long projectId;
    private Long issueId;
    private Long commentId;
    private String targetPage;
    private String statusChange;
} 