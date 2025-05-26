package com.example.softwareengineering.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Schema(description = "로그인 요청 DTO")
@Getter
@Setter
public class LoginRequestDto {
    @Schema(description = "사용자 ID 또는 이메일", example = "user@example.com 또는 userId")
    @NotBlank(message = "아이디 또는 이메일을 입력해주세요")
    private String identifier;

    @Schema(description = "사용자 비밀번호", example = "password123!")
    @NotBlank(message = "비밀번호를 입력해주세요")
    private String password;

    @Schema(description = "로그인 유지 여부", example = "true")
    private boolean rememberMe;
} 