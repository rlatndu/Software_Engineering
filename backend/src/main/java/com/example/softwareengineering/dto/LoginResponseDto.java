package com.example.softwareengineering.dto;

import lombok.Builder;
import lombok.Getter;

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
    }
} 