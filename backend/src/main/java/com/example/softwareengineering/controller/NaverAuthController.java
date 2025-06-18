package com.example.softwareengineering.controller;

import com.example.softwareengineering.service.NaverAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/naver")
public class NaverAuthController {

    private final NaverAuthService naverAuthService;

    @Autowired
    public NaverAuthController(NaverAuthService naverAuthService) {
        this.naverAuthService = naverAuthService;
    }

    // 네이버 로그인 콜백 엔드포인트
    @PostMapping("/callback")
    public Map<String, Object> naverCallback(@RequestBody Map<String, String> params) {
        String code = params.get("code");
        String state = params.get("state");

        // 1. access_token 발급
        String accessToken = naverAuthService.getAccessToken(code, state);

        // 2. 네이버 유저 정보 조회
        Map<String, Object> naverUser = naverAuthService.getUserProfile(accessToken);

        // 3. (여기서 회원가입/로그인 처리 추가 가능)
        // ex) userService.registerOrLoginNaverUser(naverUser);

        // 4. 일단 유저 정보만 프론트로 응답
        return Map.of(
                "success", true,
                "naverUser", naverUser
        );
    }
}
