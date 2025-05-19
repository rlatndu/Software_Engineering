package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);

    // 토큰으로 유저 찾기
    User findByVerificationToken(String token);
}
