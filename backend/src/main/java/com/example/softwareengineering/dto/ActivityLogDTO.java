package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.ActivityType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class ActivityLogDTO {
    private Long id;
    private Long userId;
    private ActivityType type;
    private String title;
    private String content;
    private String timestamp;
    private Long projectId;
    private String projectName;
    private Long issueId;
    private String issueName;
    private Long commentId;
    private String targetPage;
    private String statusChange;
    private String updatedAt;
}