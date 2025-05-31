package com.example.softwareengineering.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {
    private final JavaMailSender emailSender;
    private final ConcurrentHashMap<String, String> verificationCodes;
    private final ConcurrentHashMap<String, LocalDateTime> verificationCodeTimes;
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${mail.sender.name}")
    private String senderName;
    
    @Value("${mail.sender.email}")
    private String senderEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
        this.verificationCodes = new ConcurrentHashMap<>();
        this.verificationCodeTimes = new ConcurrentHashMap<>();
    }

    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    public void sendIdFindVerificationEmail(String email) {
        try {
            String verificationCode = generateVerificationCode();
            verificationCodes.put(email, verificationCode);
            verificationCodeTimes.put(email, LocalDateTime.now());

            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setFrom(String.format("%s <%s>", senderName, senderEmail));
            helper.setSubject("[Slime] 아이디 찾기 인증번호");

            String content = String.format("""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>아이디 찾기 인증번호</h2>
                        <p>안녕하세요!</p>
                        <p>Slime 서비스 아이디 찾기를 위한 인증번호입니다.</p>
                        <div style="margin: 30px 0; background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold;">
                            %s
                        </div>
                        <p>이 인증번호는 1시간 동안만 유효합니다.</p>
                        <p>감사합니다.</p>
                    </div>
                    """, verificationCode);

            helper.setText(content, true);
            emailSender.send(message);
            logger.info("ID find verification code sent successfully to: {}", email);
        } catch (MessagingException e) {
            logger.error("Failed to send ID find verification code to: {}. Error: {}", email, e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String email) {
        try {
            String verificationCode = generateVerificationCode();
            logger.info("비밀번호 재설정 인증번호 생성. 이메일: {}", email);
            
            verificationCodes.put(email, verificationCode);
            verificationCodeTimes.put(email, LocalDateTime.now());
            logger.info("인증번호 저장 완료. 이메일: {}", email);

            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setFrom(String.format("%s <%s>", senderName, senderEmail));
            helper.setSubject("[Slime] 비밀번호 재설정 인증번호");

            String content = String.format("""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>비밀번호 재설정 인증번호</h2>
                        <p>안녕하세요!</p>
                        <p>Slime 서비스 비밀번호 재설정을 위한 인증번호입니다.</p>
                        <div style="margin: 30px 0; background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold;">
                            %s
                        </div>
                        <p>이 인증번호는 1시간 동안만 유효합니다.</p>
                        <p>감사합니다.</p>
                    </div>
                    """, verificationCode);

            helper.setText(content, true);
            emailSender.send(message);
            logger.info("비밀번호 재설정 인증번호 발송 완료. 이메일: {}", email);
        } catch (MessagingException e) {
            logger.error("이메일 발송 실패. 이메일: {}, 에러: {}", email, e.getMessage(), e);
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage());
        }
    }

    public String getVerificationCode(String key) {
        String code = verificationCodes.get(key);
        if (code == null) {
            logger.warn("저장된 인증 코드를 찾을 수 없음. 키: {}", key);
        } else {
            logger.debug("인증 코드 조회 성공. 키: {}", key);
        }
        return code;
    }

    public LocalDateTime getVerificationCodeCreationTime(String key) {
        LocalDateTime time = verificationCodeTimes.get(key);
        if (time == null) {
            logger.warn("저장된 인증 코드 생성 시간을 찾을 수 없음. 키: {}", key);
        } else {
            logger.debug("인증 코드 생성 시간 조회 성공. 키: {}", key);
        }
        return time;
    }

    public void sendVerificationEmail(String email, String verificationToken) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setFrom(String.format("%s <%s>", senderName, senderEmail));
            helper.setSubject("[Slime] 이메일 인증");

            String content = String.format("""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>이메일 인증</h2>
                        <p>안녕하세요!</p>
                        <p>Slime 서비스 회원가입을 위한 이메일 인증 링크입니다.</p>
                        <div style="margin: 30px 0;">
                            <a href="%s/join/verify?token=%s" 
                               style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 4px;">
                                이메일 인증하기
                            </a>
                        </div>
                        <p>이 링크는 1시간 동안만 유효합니다.</p>
                        <p>감사합니다.</p>
                    </div>
                    """, frontendUrl, verificationToken);

            helper.setText(content, true);
            emailSender.send(message);
            logger.info("이메일 인증 메일 발송 완료. 이메일: {}", email);
        } catch (MessagingException e) {
            logger.error("이메일 발송 실패. 이메일: {}, 에러: {}", email, e.getMessage(), e);
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage());
        }
    }

    public void removeVerificationCode(String key) {
        verificationCodes.remove(key);
        verificationCodeTimes.remove(key);
        logger.info("인증 코드 삭제 완료. 키: {}", key);
    }
} 