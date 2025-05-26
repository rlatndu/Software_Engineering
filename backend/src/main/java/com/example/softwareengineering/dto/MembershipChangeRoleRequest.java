package com.example.softwareengineering.dto;

public class MembershipChangeRoleRequest {
    private String role; // "ADMIN", "PM", "MEMBER"
    private Long changerId;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getChangerId() { return changerId; }
    public void setChangerId(Long changerId) { this.changerId = changerId; }
} 