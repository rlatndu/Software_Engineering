package com.example.softwareengineering.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@Service
public class NaverAuthService {

    @Value("${naver.client-id}")
    private String clientId;

    @Value("${naver.client-secret}")
    private String clientSecret;

    @Value("${naver.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate;

    @Autowired
    public NaverAuthService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // 네이버 access_token 요청 메서드
    public String getAccessToken(String code, String state) {
        String tokenUrl = "https://nid.naver.com/oauth2.0/token"
                + "?grant_type=authorization_code"
                + "&client_id=" + clientId
                + "&client_secret=" + clientSecret
                + "&code=" + code
                + "&state=" + state;

        ResponseEntity<Map> response = restTemplate.getForEntity(tokenUrl, Map.class);
        Map<String, Object> body = response.getBody();

        if (body != null && body.containsKey("access_token")) {
            return (String) body.get("access_token");
        } else {
            throw new RuntimeException("네이버 access_token 발급 실패! " + body);
        }
    }

    // 네이버 사용자 정보 요청 메서드
    public Map<String, Object> getUserProfile(String accessToken) {
        String profileUrl = "https://openapi.naver.com/v1/nid/me";
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                profileUrl,
                org.springframework.http.HttpMethod.GET,
                entity,
                Map.class
        );

        Map<String, Object> body = response.getBody();

        if (body != null && "00".equals(body.get("resultcode"))) {
            return (Map<String, Object>) body.get("response");
        } else {
            throw new RuntimeException("네이버 사용자 정보 조회 실패! " + body);
        }
    }
}

