package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.SignupRequestDto;
import com.example.softwareengineering.entity.User;
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

        // 1. 비밀번호 확인 일치 검사
        if (!dto.getPassword().equals(dto.getPasswordConfirm())) {
            return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
        }

        // 2. 아이디 중복 검사
        if (userRepository.existsByUsername(dto.getUsername())) {
            return "이미 존재하는 아이디입니다.";
        }

        // 3. 이메일 중복 검사
        if (userRepository.existsByEmail(dto.getEmail())) {
            return "이미 존재하는 이메일입니다.";
        }

        // 4. 비밀번호 정책 검사
        if (dto.getPassword().length() < 8 || !dto.getPassword().matches(".*[!@#$%^&*()].*")) {
            return "비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.";
        }

        // 5. 사용자 저장 (이메일 인증은 아직 인증 전 단계)
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setUsername(dto.getUsername()); // 이름 대신 아이디를 쓰는 구조인 경우
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        userRepository.save(user);

        // 6. 이메일 인증 메일 발송
        String token = UUID.randomUUID().toString(); // 나중에 DB에 저장 필요
        String link = "http://localhost:8080/api/auth/verify?token=" + token;
        mailService.sendVerificationEmail(dto.getEmail(), link);


        mailService.sendVerificationEmail(dto.getEmail(), "http://localhost:8080/api/auth/verify?token=abc123");

        return "회원가입 요청 완료! 이메일 인증을 진행해주세요.";
    }
}
