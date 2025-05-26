package com.example.softwareengineering.entity;

public enum ActivityType {
    PAGE_VIEW("페이지 이동"),
    ISSUE_CREATE("이슈 생성"),
    ISSUE_UPDATE("이슈 수정"),
    ISSUE_STATUS_CHANGE("상태 변경"),
    COMMENT_CREATE("댓글 작성"),
    COMMENT_UPDATE("댓글 수정");

    private final String description;

    ActivityType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 