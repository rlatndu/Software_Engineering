package com.example.softwareengineering.dto;

import com.example.softwareengineering.entity.ActivityType;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userProfileImage;
    private ActivityType type;
    private String content;
    private String targetUrl;
    private LocalDateTime createdAt;

    public String getFormattedContent() {
        String timestamp = createdAt.format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm"));
        
        return switch (type) {
            case PAGE_NAVIGATION -> String.format("페이지 이동 - %s [%s]", content, timestamp);
            case ISSUE_CREATE -> String.format("이슈 생성 - %s [%s]", content, timestamp);
            case ISSUE_UPDATE -> String.format("이슈 수정 - %s [%s]", content, timestamp);
            case ISSUE_STATUS_CHANGE -> {
                String[] parts = content.split(":");  // "DONE:이슈 제목" 형식으로 저장된 것으로 가정
                String status = parts.length > 0 ? parts[0] : "";
                String title = parts.length > 1 ? parts[1] : content;
                yield String.format("%s 변경 - %s [%s]", status, title, timestamp);
            }
            case COMMENT_CREATE -> String.format("댓글 작성 - %s [%s]", content, timestamp);
            case COMMENT_UPDATE -> String.format("댓글 수정 - %s [%s]", content, timestamp);
        };
    }
} 