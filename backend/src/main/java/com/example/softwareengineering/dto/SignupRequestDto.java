package com.example.softwareengineering.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Schema(description = "회원가입 요청 DTO")
@Getter
@Setter
public class SignupRequestDto {
    @Schema(description = "이메일", example = "user@example.com")
    @NotBlank(message = "이메일은 필수 입력값입니다")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String email;

    @Schema(description = "비밀번호", example = "Password123!")
    @NotBlank(message = "비밀번호는 필수 입력값입니다")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
            message = "비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다")
    private String password;

    @Schema(description = "비밀번호 확인", example = "Password123!")
    @NotBlank(message = "비밀번호 확인은 필수 입력값입니다")
    private String passwordConfirm;

    @Schema(description = "사용자 ID", example = "user123")
    @NotBlank(message = "사용자 ID는 필수 입력값입니다")
    @Pattern(regexp = "^[a-zA-Z0-9]{4,20}$",
            message = "사용자 ID는 4~20자의 영문자 또는 숫자여야 합니다")
    private String userId;
}
