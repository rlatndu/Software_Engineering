package com.example.softwareengineering.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Autowired
    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom("imnameone@naver.com");
            helper.setSubject("[회원가입 인증] 이메일 인증을 완료해주세요");

            String htmlContent = "<p>다음 링크를 클릭하여 인증을 완료하세요:</p>" +
                    "<p><a href=\"" + verificationLink + "\">인증 링크</a></p>";

            helper.setText(htmlContent, true);  // true -> HTML 사용

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("메일 전송 실패: " + e.getMessage());
        }
    }
}
