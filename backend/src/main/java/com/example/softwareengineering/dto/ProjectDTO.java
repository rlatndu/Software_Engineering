package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.Project;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ProjectDTO {
    private Long id;
    private Long siteId;
    private String name;
    private String key;
    private boolean isPrivate;
    private LocalDateTime createdAt;
    private CreatorDTO createdBy;

    @Getter
    @Setter
    @Builder
    public static class CreatorDTO {
        private Long id;
        private String userId;
    }

    public static ProjectDTO from(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .siteId(project.getSite().getId())
                .name(project.getName())
                .key(project.getKey())
                .isPrivate(project.isPrivate())
                .createdAt(project.getCreatedAt())
                .createdBy(CreatorDTO.builder()
                        .id(project.getCreatedBy().getId())
                        .userId(project.getCreatedBy().getUserId())
                        .build())
                .build();
    }
} 