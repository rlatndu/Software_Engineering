package com.example.softwareengineering.dto;

import lombok.Builder;
import lombok.Getter;
import com.example.softwareengineering.entity.MemberRole;
import java.util.Map;

@Getter
@Builder
public class LoginResponseDto {
    private String token;
    private UserDto user;
    private String message;

    @Getter
    @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String userId;
        private Map<Long, MemberRole> siteRoles;  // key: siteId, value: role
    }
} 