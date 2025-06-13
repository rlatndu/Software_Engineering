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
public class ActivityCreateRequest {
    private Long userId;
    private ActivityType type;
    private String content;
    private String targetPage;
    private String statusChange;
} 