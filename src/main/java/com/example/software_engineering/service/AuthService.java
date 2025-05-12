package com.example.software_engineering.service;

import com.example.software_engineering.dto.SignupRequestDto;
import com.example.software_engineering.entity.User;
import com.example.software_engineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public String signup(SignupRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            return "이미 존재하는 이메일입니다.";
        }

        if (dto.getPassword().length() < 8 || !dto.getPassword().matches(".*[!@#$%^&*()].*")) {
            return "비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.";
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setName(dto.getName());
        user.setPassword(dto.getPassword()); // 추후 암호화 예정

        userRepository.save(user);
        return "회원가입 성공!";
    }
}
