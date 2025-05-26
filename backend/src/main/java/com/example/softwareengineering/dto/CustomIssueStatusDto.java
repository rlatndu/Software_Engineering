package com.example.softwareengineering.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomIssueStatusDto {
    private Long id;
    private String name;
    private Long projectId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 