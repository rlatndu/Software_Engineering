package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.SignupRequestDto;
import com.example.softwareengineering.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public String signup(@RequestBody @Valid SignupRequestDto dto) {
        return authService.signup(dto);
    }

    // 이메일 인증 처리용 엔드포인트
    @GetMapping("/verify")
    public String verify(@RequestParam("token") String token) {
        return authService.verifyToken(token);
    }
}
