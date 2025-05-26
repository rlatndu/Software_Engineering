package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String content;
    private String targetUrl;
    private boolean checked;
    private LocalDateTime createdAt;
} 