package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.SignupRequestDto;
import com.example.softwareengineering.entity.EmailVerification;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.repository.EmailVerificationRepository;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.softwareengineering.dto.LoginRequestDto;
import com.example.softwareengineering.dto.LoginResponseDto;
import com.example.softwareengineering.config.JwtUtil;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.example.softwareengineering.service.EmailService;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Value("${frontend.url}")
    private String frontendUrl;

    @Transactional
public String sendVerificationEmail(String email) {
    // 이미 가입된 이메일 체크
    if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요.");
        }

        // 이미 인증된 이메일인지 확인
        Optional<EmailVerification> existingVerification = emailVerificationRepository.findByEmail(email);
        if (existingVerification.isPresent() && existingVerification.get().isVerified()) {
            return "이미 인증이 완료된 이메일입니다. 회원가입을 계속 진행해주세요.";
    }

    int maxRetries = 3;
    int retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            logger.info("1단계: 중복 이메일 확인 완료");
            emailVerificationRepository.deleteByEmail(email);
            emailVerificationRepository.flush();
            logger.info("2단계: 기존 인증 삭제 완료");

            // 새 인증 토큰 생성
            String token = UUID.randomUUID().toString();
            EmailVerification verification = new EmailVerification();
            verification.setEmail(email);
            verification.setToken(token);
            verification.setCreatedAt(LocalDateTime.now());
            verification.setVerified(false);
            logger.info("3단계: 인증 객체 생성 완료");

            emailVerificationRepository.saveAndFlush(verification);
            logger.info("4단계: DB 저장 완료");

            // 인증 메일 발송 - 여기를 수정
            String verificationLink = frontendUrl + "/join/verify?token=" + token;
            logger.info("5단계: 메일 전송 시작, 인증 링크: {}", verificationLink);
            mailService.sendVerificationEmail(email, verificationLink);
            logger.info("6단계: 메일 전송 완료");

            return "인증 메일이 발송되었습니다";

        } catch (Exception e) {
            retryCount++;
            logger.error("에러 발생! {}번째 시도 실패: {}", retryCount, e.getMessage(), e);
            if (retryCount >= maxRetries) {
                try {
                    emailVerificationRepository.deleteByEmail(email);
                    emailVerificationRepository.flush();
                } catch (Exception ex) {
                    logger.warn("정리 중 에러 무시됨: {}", ex.getMessage());
                }
                throw new RuntimeException("이메일 인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            try {
                Thread.sleep(100 * (retryCount + 1));
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("처리가 중단되었습니다");
            }
        }
    }

    throw new RuntimeException("이메일 인증 처리에 실패했습니다");
}

    @Transactional
    public Map<String, Object> verifyEmail(String token) {
        // 토큰으로 먼저 검증 데이터를 찾음
        EmailVerification verification = emailVerificationRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("유효하지 않은 인증 토큰입니다"));

        // 이메일과 토큰을 함께 검증하고 만료 시간도 체크
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        if (verification.getCreatedAt().isBefore(cutoff)) {
            throw new RuntimeException("만료된 인증 링크입니다");
        }

        // 이미 인증된 경우
        if (verification.isVerified()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이미 인증이 완료된 이메일입니다");
            response.put("email", verification.getEmail());
            return response;
        }

        try {
            verification.setVerified(true);
            emailVerificationRepository.save(verification);
            logger.info("Email verification successful for token: {}", token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이메일 인증이 완료되었습니다");
            response.put("email", verification.getEmail());
            return response;
        } catch (Exception e) {
            logger.error("Error during email verification: {}", e.getMessage());
            throw new RuntimeException("이메일 인증 처리 중 오류가 발생했습니다");
        }
    }

    @Transactional
    public String signup(SignupRequestDto dto) {
        // 이메일 인증 확인
        EmailVerification verification = emailVerificationRepository.findByEmail(dto.getEmail())
            .orElseThrow(() -> new RuntimeException("이메일 인증이 필요합니다"));

        if (!verification.isVerified()) {
            throw new RuntimeException("이메일 인증이 필요합니다");
        }

        // 비밀번호 확인
        if (!dto.getPassword().equals(dto.getPasswordConfirm())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다");
        }

        // 아이디 중복 체크
        if (userRepository.existsByUserId(dto.getUserId())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다");
        }

        // 사용자 생성
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .userId(dto.getUserId())
                .role(MemberRole.MEMBER)
                .emailVerified(true)
                .build();

        userRepository.save(user);
        emailVerificationRepository.delete(verification);

        return "회원가입이 완료되었습니다";
    }

    @Transactional(readOnly = true)
    public boolean isEmailVerified(String email) {
        return emailVerificationRepository.findByEmail(email)
            .map(EmailVerification::isVerified)
            .orElse(false);
    }

    @Transactional
    public LoginResponseDto login(LoginRequestDto dto) {
        // 입력값 검증
        if (dto.getIdentifier() == null || dto.getIdentifier().trim().isEmpty()) {
            throw new RuntimeException("아이디 또는 이메일을 입력해주세요");
        }
        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new RuntimeException("비밀번호를 입력해주세요");
        }

        // 이메일 또는 아이디로 사용자 찾기
        User user = userRepository.findByEmailOrUserId(dto.getIdentifier(), dto.getIdentifier())
                .orElseThrow(() -> new RuntimeException("등록되지 않은 아이디이거나, 아이디 또는 비밀번호를 잘못 입력했습니다"));

        // 비밀번호 확인
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            logger.warn("Failed login attempt for user: {}", dto.getIdentifier());
            throw new RuntimeException("아이디 또는 비밀번호를 잘못 입력했습니다");
        }

        // 이메일 인증 확인
        if (!user.isEmailVerified()) {
            throw new RuntimeException("이메일 인증이 필요합니다. 회원가입 시 받은 인증 메일을 확인해주세요");
        }

        try {
            // JWT 토큰 생성
            String token = jwtUtil.generateToken(user.getEmail(), user.getId());

            logger.info("Successful login for user: {}", dto.getIdentifier());

            // 응답 생성
            return LoginResponseDto.builder()
                    .token(token)
                    .user(LoginResponseDto.UserDto.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .userId(user.getUserId())
                            .build())
                    .message("로그인이 완료되었습니다")
                    .build();
        } catch (Exception e) {
            logger.error("Token generation failed for user: {}", dto.getIdentifier(), e);
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요");
        }
    }

    public String findUserIdByEmailAndCode(String email, String code) {
        String storedCode = emailService.getVerificationCode(email);
        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("유효하지 않은 인증 코드입니다.");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));

        return user.getUserId();
    }

    public void verifyPasswordResetCode(String email, String code) {
        String storedCode = emailService.getVerificationCode(email);
        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("유효하지 않은 인증 코드입니다.");
        }

        // 이메일로 사용자 찾기
        userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        // 인증 코드 확인
        String storedCode = emailService.getVerificationCode(email);
        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("유효하지 않은 인증 코드입니다.");
        }

        // 사용자 찾기
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}

