package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.ActivityType;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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