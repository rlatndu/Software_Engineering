package com.example.softwareengineering.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {
    private final JavaMailSender emailSender;
    private final ConcurrentHashMap<String, String> verificationCodes;

    @Value("${mail.sender.name}")
    private String senderName;
    
    @Value("${mail.sender.email}")
    private String senderEmail;

    @Autowired
    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
        this.verificationCodes = new ConcurrentHashMap<>();
    }

    public void sendIdFindVerificationCode(String email) {
        String code = generateVerificationCode();
        verificationCodes.put(email, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(String.format("%s <%s>", "Slime", senderEmail));
        message.setTo(email);
        message.setSubject("Slime - 아이디 찾기 인증 코드");
        message.setText("아이디 찾기 인증 코드: " + code + "\n\n이 코드는 10분간 유효합니다.");

        emailSender.send(message);
    }

    public void sendPasswordResetCode(String identifier) {
        String code = generateVerificationCode();
        verificationCodes.put(identifier, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(String.format("%s <%s>", "Slime", senderEmail));
        message.setTo(identifier); // 이메일로 사용됨
        message.setSubject("Slime - 비밀번호 재설정 인증 코드");
        message.setText("비밀번호 재설정 인증 코드: " + code + "\n\n이 코드는 10분간 유효합니다.");

        emailSender.send(message);
    }

    public String getVerificationCode(String key) {
        return verificationCodes.get(key);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }
} 