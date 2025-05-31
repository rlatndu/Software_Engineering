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
import org.springframework.http.CacheControl;

import java.util.Map;
import java.util.HashMap;

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
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequestDto dto) {
        try {
            Map<String, Object> result = authService.signup(dto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
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
        logger.info("이메일 인증 요청 수신. 토큰: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            logger.error("토큰이 비어있거나 null입니다");
            throw new IllegalArgumentException("토큰이 필요합니다");
        }
        
        try {
            logger.debug("인증 서비스 호출 시작");
            Map<String, Object> result = authService.verifyEmail(token);
            logger.info("이메일 인증 성공. 응답: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("이메일 인증 실패. 토큰: {}, 에러: {}", token, e.getMessage(), e);
            throw e;
        }
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

    @PostMapping("/find-id/send")
    @Operation(summary = "아이디 찾기 이메일 발송", description = "아이디 찾기를 위한 인증번호를 이메일로 발송합니다.")
    public ResponseEntity<MessageResponse> sendIdFindEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        emailService.sendIdFindVerificationEmail(email);
        return ResponseEntity.ok(new MessageResponse("인증번호가 이메일로 발송되었습니다."));
    }

    @PostMapping("/find-id/verify")
    @Operation(summary = "아이디 찾기 인증", description = "이메일로 발송된 인증번호를 검증하고 아이디를 반환합니다.")
    public ResponseEntity<IdFindResponse> verifyIdFindCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String userId = authService.findUserIdByEmailAndCode(email, code);
        return ResponseEntity.ok(new IdFindResponse(userId, "아이디를 찾았습니다."));
    }

    @PostMapping("/password/send")
    @Operation(summary = "비밀번호 재설정 이메일 발송", description = "비밀번호 재설정을 위한 인증번호를 이메일로 발송합니다.")
    public ResponseEntity<MessageResponse> sendPasswordResetEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        emailService.sendPasswordResetEmail(email);
        return ResponseEntity.ok(new MessageResponse("인증번호가 이메일로 발송되었습니다."));
    }

    @PostMapping("/password/verify")
    @Operation(summary = "비밀번호 재설정 인증", description = "이메일로 발송된 인증번호를 검증합니다.")
    public ResponseEntity<Map<String, Object>> verifyPasswordResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        
        logger.info("비밀번호 재설정 인증번호 검증 요청 수신. 이메일: {}", email);
        
        try {
            boolean isVerified = authService.verifyPasswordResetCode(email, code);
            logger.info("비밀번호 재설정 인증번호 검증 결과. 이메일: {}, 인증 여부: {}", email, isVerified);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", isVerified);
            response.put("message", isVerified ? "인증되었습니다." : "인증번호가 일치하지 않습니다.");
            response.put("email", email);
            response.put("verified", isVerified);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(response);
            
        } catch (IllegalArgumentException e) {
            logger.error("비밀번호 재설정 인증 실패. 이메일: {}, 에러: {}", email, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("email", email);
            response.put("verified", false);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.badRequest()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(response);
            
        } catch (Exception e) {
            logger.error("비밀번호 재설정 인증 처리 중 오류 발생. 이메일: {}, 에러: {}", email, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "인증 처리 중 오류가 발생했습니다.");
            response.put("email", email);
            response.put("verified", false);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(response);
        }
    }

    @PostMapping("/password/reset")
    @Operation(summary = "비밀번호 재설정", description = "인증된 코드로 새 비밀번호를 설정합니다.")
    public ResponseEntity<MessageResponse> resetPasswordWithCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        
        if (email == null || code == null || newPassword == null) {
            throw new IllegalArgumentException("필수 정보가 누락되었습니다.");
        }

        // 코드 재검증
        if (!authService.verifyPasswordResetCode(email, code)) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("유효하지 않은 인증번호입니다. 다시 시도해주세요."));
        }

        authService.resetPasswordWithCode(email, code, newPassword);
        return ResponseEntity.ok(new MessageResponse("비밀번호가 변경되었습니다."));
    }

    @PostMapping("/password/change")
    @Operation(summary = "비밀번호 변경", description = "현재 비밀번호 확인 후 새 비밀번호로 변경합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "비밀번호 변경 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    public ResponseEntity<MessageResponse> changePassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (email == null || currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("필수 정보가 누락되었습니다.");
        }

        authService.changePassword(email, currentPassword, newPassword);
        return ResponseEntity.ok(new MessageResponse("비밀번호가 변경되었습니다."));
    }

    @PostMapping("/verify-token")
    @Operation(summary = "토큰 검증", description = "JWT 토큰의 유효성을 검증합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "토큰 검증 성공"),
        @ApiResponse(responseCode = "401", description = "유효하지 않은 토큰")
    })
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "success", false,
                        "message", "토큰이 없거나 유효하지 않습니다."
                    ));
            }

            String token = authHeader.substring(7);
            boolean isValid = authService.verifyToken(token);

            return ResponseEntity.ok(Map.of(
                "success", isValid,
                "message", isValid ? "유효한 토큰입니다." : "유효하지 않은 토큰입니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "success", false,
                    "message", "토큰 검증에 실패했습니다."
                ));
        }
    }
}
