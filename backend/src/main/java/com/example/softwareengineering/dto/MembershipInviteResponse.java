package com.example.softwareengineering.dto;

public class MembershipInviteResponse {
    private Long invitationId;
    private String status; // "PENDING", "ACCEPTED", "REJECTED"

    public Long getInvitationId() { return invitationId; }
    public void setInvitationId(Long invitationId) { this.invitationId = invitationId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
} 