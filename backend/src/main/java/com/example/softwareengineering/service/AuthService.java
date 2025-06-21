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
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.SiteRepository;
import com.example.softwareengineering.entity.Site;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final SiteMemberRepository siteMemberRepository;
    private final SiteRepository siteRepository;
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
        logger.info("이메일 인증 프로세스 시작. 토큰: {}", token);
        
        // 토큰으로 먼저 검증 데이터를 찾음
        EmailVerification verification = emailVerificationRepository.findByToken(token)
            .orElseThrow(() -> {
                logger.error("유효하지 않은 인증 토큰: {}", token);
                return new RuntimeException("유효하지 않은 인증 토큰입니다");
            });

        logger.info("이메일 검증 데이터 찾음. 이메일: {}, 생성시간: {}", 
            verification.getEmail(), verification.getCreatedAt());

        // 이메일과 토큰을 함께 검증하고 만료 시간도 체크
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        if (verification.getCreatedAt().isBefore(cutoff)) {
            logger.error("토큰 만료됨. 이메일: {}, 생성시간: {}, 만료시간: {}", 
                verification.getEmail(), verification.getCreatedAt(), cutoff);
            throw new RuntimeException("만료된 인증 링크입니다");
        }

        logger.info("토큰 유효성 확인됨. 이메일: {}", verification.getEmail());

        // 이미 인증된 경우
        if (verification.isVerified()) {
            logger.info("이미 인증된 이메일: {}", verification.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이미 인증이 완료된 이메일입니다");
            response.put("email", verification.getEmail());
            return response;
        }

        try {
            verification.setVerified(true);
            emailVerificationRepository.save(verification);
            logger.info("이메일 인증 완료. 이메일: {}", verification.getEmail());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "이메일 인증이 완료되었습니다");
            response.put("email", verification.getEmail());
            return response;
        } catch (Exception e) {
            logger.error("이메일 인증 처리 중 오류 발생. 이메일: {}, 에러: {}", 
                verification.getEmail(), e.getMessage(), e);
            throw new RuntimeException("이메일 인증 처리 중 오류가 발생했습니다");
        }
    }

    @Transactional
    public Map<String, Object> signup(SignupRequestDto signupRequestDto) {
        Map<String, Object> response = new HashMap<>();

        // 이메일 중복 체크
        if (userRepository.existsByEmail(signupRequestDto.getEmail())) {
            response.put("success", false);
            response.put("message", "이미 사용 중인 이메일입니다.");
            return response;
        }

        // 사용자 ID 중복 체크
        if (userRepository.existsByUserId(signupRequestDto.getUserId())) {
            response.put("success", false);
            response.put("message", "이미 사용 중인 사용자 ID입니다.");
            return response;
        }

        // 이메일 인증 확인
        EmailVerification verification = emailVerificationRepository.findByEmail(signupRequestDto.getEmail())
                .orElseThrow(() -> new RuntimeException("이메일 인증이 필요합니다."));

        if (!verification.isVerified()) {
            response.put("success", false);
            response.put("message", "이메일 인증이 필요합니다.");
            return response;
        }

        // 사용자 생성
        User user = User.builder()
                .email(signupRequestDto.getEmail())
                .password(passwordEncoder.encode(signupRequestDto.getPassword()))
                .userId(signupRequestDto.getUserId())
                .emailVerified(true)  // 이미 인증된 상태로 설정
                .build();

        user = userRepository.save(user);

        response.put("success", true);
        response.put("message", "회원가입이 완료되었습니다.");
        return response;
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

        logger.info("로그인 시도: {}", dto.getIdentifier());

        try {
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

            // JWT 토큰 생성
            String token = jwtUtil.generateToken(user.getEmail(), user.getId());
            logger.info("Generated token for user: {}", dto.getIdentifier());

            if (token == null || token.trim().isEmpty()) {
                throw new RuntimeException("토큰 생성에 실패했습니다");
            }

            // 사용자의 사이트별 권한 정보 조회
            List<SiteMember> siteMembers = siteMemberRepository.findByUser(user);
            Map<Long, MemberRole> siteRoles = new HashMap<>();
            for (SiteMember siteMember : siteMembers) {
                siteRoles.put(siteMember.getSite().getId(), siteMember.getRole());
            }

            logger.info("Successful login for user: {}", dto.getIdentifier());

            // 응답 생성
            LoginResponseDto response = LoginResponseDto.builder()
                    .token(token)
                    .user(LoginResponseDto.UserDto.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .userId(user.getUserId())
                            .siteRoles(siteRoles)
                            .build())
                    .message("로그인이 완료되었습니다")
                    .build();

            logger.info("Login response created for user: {}, hasToken: {}", 
                dto.getIdentifier(), response.getToken() != null);

            return response;
        } catch (Exception e) {
            logger.error("Login failed for user: {}, error: {}", dto.getIdentifier(), e.getMessage(), e);
            throw e;
        }
    }

    public String findUserIdByEmailAndCode(String email, String code) {
        // 인증번호 확인
        String storedCode = emailService.getVerificationCode(email);
        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("유효하지 않은 인증번호입니다.");
        }

        // 유효시간 체크 (1시간)
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        if (emailService.getVerificationCodeCreationTime(email).isBefore(cutoff)) {
            throw new IllegalArgumentException("만료된 인증번호입니다. 다시 시도해주세요.");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));

        // 인증번호 삭제
        emailService.removeVerificationCode(email);

        return user.getUserId();
    }

    public boolean verifyPasswordResetCode(String email, String code) {
        logger.info("비밀번호 재설정 인증번호 검증 시작. 이메일: {}", email);
        
        try {
            // 인증번호 확인
            String storedCode = emailService.getVerificationCode(email);
            if (storedCode == null) {
                logger.error("저장된 인증번호가 없음. 이메일: {}", email);
                return false;
            }
            
            if (!storedCode.equals(code)) {
                logger.error("인증번호 불일치. 이메일: {}", email);
                return false;
            }

            logger.info("인증번호 일치 확인됨. 이메일: {}", email);

            // 유효시간 체크 (1시간)
            LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
            LocalDateTime codeCreationTime = emailService.getVerificationCodeCreationTime(email);
            
            if (codeCreationTime == null) {
                logger.error("인증번호 생성 시간 정보 없음. 이메일: {}", email);
                return false;
            }

            if (codeCreationTime.isBefore(cutoff)) {
                logger.error("인증번호 만료됨. 이메일: {}, 생성시간: {}, 만료시간: {}", 
                    email, codeCreationTime, cutoff);
                return false;
            }

            logger.info("인증번호 유효시간 확인됨. 이메일: {}", email);

            // 이메일로 사용자 찾기
            userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("사용자를 찾을 수 없음. 이메일: {}", email);
                    return new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다.");
                });
                
            logger.info("비밀번호 재설정 인증번호 검증 완료. 이메일: {}", email);
            return true;
            
        } catch (Exception e) {
            logger.error("사용자 조회 중 오류 발생. 이메일: {}, 에러: {}", email, e.getMessage(), e);
            return false;
        }
    }

    @Transactional
    public void resetPasswordWithCode(String email, String code, String newPassword) {
        // 인증번호 확인
        String storedCode = emailService.getVerificationCode(email);
        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("유효하지 않은 인증번호입니다.");
        }

        // 유효시간 체크 (1시간)
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        if (emailService.getVerificationCodeCreationTime(email).isBefore(cutoff)) {
            throw new IllegalArgumentException("만료된 인증번호입니다. 다시 시도해주세요.");
        }

        // 사용자 찾기
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));

        // 새 비밀번호가 기존 비밀번호와 같은지 확인
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("새 비밀번호가 기존 비밀번호와 동일합니다. 다른 비밀번호를 선택해주세요.");
        }

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 인증번호 삭제
        emailService.removeVerificationCode(email);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        // 사용자 찾기
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 사용자를 찾을 수 없습니다."));

        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호가 현재 비밀번호와 같은지 확인
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public boolean verifyToken(String token) {
        try {
            jwtUtil.validateToken(token);
            return true;
        } catch (Exception e) {
            logger.error("토큰 검증 실패: {}", e.getMessage());
            return false;
        }
    }
}

