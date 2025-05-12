package com.example.software_engineering.controller;

import com.example.software_engineering.dto.SignupRequestDto;
import com.example.software_engineering.service.AuthService;
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

}
