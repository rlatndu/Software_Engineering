package com.example.softwareengineering.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class ProjectWithMembersDto {
    private Long projectId;
    private String projectName;
    private List<MemberInfo> members;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class MemberInfo {
        private String userId;   // 로그인 ID
        private String role;     // ADMIN, PM, MEMBER
    }
} 