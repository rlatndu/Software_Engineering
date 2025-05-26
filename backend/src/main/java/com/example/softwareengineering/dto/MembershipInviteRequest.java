package com.example.softwareengineering.dto;

public class MembershipInviteRequest {
    private Long siteId;      // 사이트 초대 시 사용
    private Long projectId;   // 프로젝트 초대 시 사용
    private String inviteeEmail;
    private String userId;    // 닉네임 기반 초대 시 사용
    private Long inviterId;
    private String role;      // "PM" 또는 "MEMBER"

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getInviteeEmail() { return inviteeEmail; }
    public void setInviteeEmail(String inviteeEmail) { this.inviteeEmail = inviteeEmail; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getInviterId() { return inviterId; }
    public void setInviterId(Long inviterId) { this.inviterId = inviterId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
} 