package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.SignupRequestDto;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.User.Role;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MailService mailService;

    public String signup(SignupRequestDto dto) {
        // 1. 비밀번호 확인
        if (!dto.getPassword().equals(dto.getPasswordConfirm())) {
            return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
        }

        // 2. 이메일 중복 (테스트 계정은 예외)
        if (!dto.getEmail().equals("imnameone@naver.com") && userRepository.existsByEmail(dto.getEmail())) {
            return "이미 존재하는 이메일입니다.";
        }

        // 3. 비밀번호 조건
        if (dto.getPassword().length() < 8 || !dto.getPassword().matches(".*[!@#$%^&*()].*")) {
            return "비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.";
        }

        // 4. 엔티티 생성 및 저장
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setName(dto.getName());
        user.setRole(Role.MEMBER); // enum 지정
        user.setEmailVerified(false);

        // 5. 인증 토큰 생성
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);

        userRepository.save(user);

        // 6. 이메일 전송
        String link = "http://localhost:8080/api/auth/verify?token=" + token;
        mailService.sendVerificationEmail(dto.getEmail(), link);

        return "회원가입 완료! 이메일 인증 링크를 확인해주세요.";
    }

    public String verifyToken(String token) {
        User user = userRepository.findByVerificationToken(token);
        if (user == null) {
            return "유효하지 않은 인증 링크입니다.";
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null); // 인증 완료 후 토큰 제거
        userRepository.save(user);

        return "이메일 인증이 완료되었습니다!";
    }
}
