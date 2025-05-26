package com.example.softwareengineering.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class MailService {
    private final JavaMailSender mailSender;
    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    @Value("${mail.sender.name}")
    private String senderName;
    
    @Value("${mail.sender.email}")
    private String senderEmail;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom(String.format("%s <%s>", senderName, senderEmail));
            helper.setSubject("[Slime] 이메일 인증");

            String content = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>이메일 인증</h2>
                    <p>안녕하세요!</p>
                    <p>Slime 서비스 이메일 인증을 완료하려면 아래 버튼을 클릭해주세요.</p>
                    <div style="margin: 30px 0;">
                        <a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">이메일 인증하기</a>
                    </div>
                    <p>이 링크는 30분 동안만 유효합니다.</p>
                    <p>감사합니다.</p>
                </div>
                """, verificationLink);

            helper.setText(content, true);
            logger.info("Sending verification email to: {}", toEmail);
            mailSender.send(message);
            logger.info("Verification email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send verification email to: {}. Error: {}", toEmail, e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error while sending email to: {}. Error: {}", toEmail, e.getMessage());
            throw new RuntimeException("이메일 발송 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
