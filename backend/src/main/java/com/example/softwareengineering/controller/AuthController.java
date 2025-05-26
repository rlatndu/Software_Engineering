package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.SignupRequestDto;
import com.example.softwareengineering.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.example.softwareengineering.dto.LoginRequestDto;
import com.example.softwareengineering.dto.LoginResponseDto;
import com.example.softwareengineering.dto.IdFindRequest;
import com.example.softwareengineering.dto.MessageResponse;
import com.example.softwareengineering.dto.IdFindResponse;
import com.example.softwareengineering.service.EmailService;
import com.example.softwareengineering.dto.PasswordResetRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "인증", description = "회원가입 및 인증 관련 API")
public class AuthController {
    private final AuthService authService;
    private final EmailService emailService;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    @PostMapping("/signup")
    @Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "회원가입 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupRequestDto dto) {
        String result = authService.signup(dto);
        return ResponseEntity.ok(Map.of("message", result));
    }

    @PostMapping("/verify/send")
    @Operation(summary = "이메일 인증 요청", description = "이메일 인증 링크를 발송합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "인증 메일 발송 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    public ResponseEntity<Map<String, String>> sendVerificationEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String result = authService.sendVerificationEmail(email);
        return ResponseEntity.ok(Map.of("message", result));
    }

    @PostMapping("/verify")
    @Operation(summary = "이메일 인증", description = "이메일 인증 토큰을 검증합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "인증 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Map<String, Object> result = authService.verifyEmail(token);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check")
    @Operation(summary = "서버 상태 확인", description = "API 서버의 상태를 확인합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "서버 정상 동작 중")
    })
    public ResponseEntity<Map<String, Object>> checkServerStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Server is running"
        ));
    }

    @GetMapping("/verify/check")
    @Operation(summary = "이메일 인증 상태 확인", description = "이메일의 인증 상태를 확인합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "확인 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    public ResponseEntity<Map<String, Object>> checkEmailVerification(@RequestParam String email) {
        boolean isVerified = authService.isEmailVerified(email);
        return ResponseEntity.ok(Map.of(
            "verified", isVerified,
            "message", isVerified ? "이메일이 인증되었습니다" : "이메일이 인증되지 않았습니다"
        ));
    }

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "사용자 로그인을 처리합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "로그인 성공"),
        @ApiResponse(responseCode = "401", description = "인증 실패"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto dto) {
        try {
            LoginResponseDto response = authService.login(dto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "success", false,
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "message", "서버 오류가 발생했습니다."
                ));
        }
    }

    @PostMapping("/find-id/send-code")
    public ResponseEntity<MessageResponse> sendIdFindCode(@RequestBody IdFindRequest request) {
        emailService.sendIdFindVerificationCode(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("인증 코드가 이메일로 발송되었습니다."));
    }

    @PostMapping("/find-id/verify-code")
    public ResponseEntity<IdFindResponse> verifyIdFindCode(@RequestBody IdFindRequest request) {
        String userId = authService.findUserIdByEmailAndCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(new IdFindResponse(userId, "아이디를 찾았습니다."));
    }

    @PostMapping("/password/send-code")
    public ResponseEntity<MessageResponse> sendPasswordResetCode(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        emailService.sendPasswordResetCode(identifier);
        return ResponseEntity.ok(new MessageResponse("인증 코드가 이메일로 발송되었습니다."));
    }

    @PostMapping("/password/verify-code")
    public ResponseEntity<MessageResponse> verifyPasswordResetCode(@RequestBody PasswordResetRequest request) {
        authService.verifyPasswordResetCode(request.getIdentifier(), request.getCode());
        return ResponseEntity.ok(new MessageResponse("인증되었습니다."));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody PasswordResetRequest request) {
        authService.resetPassword(request.getIdentifier(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(new MessageResponse("비밀번호가 변경되었습니다."));
    }
}
