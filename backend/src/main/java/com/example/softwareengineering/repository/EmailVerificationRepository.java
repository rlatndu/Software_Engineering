package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findByEmail(String email);
    Optional<EmailVerification> findByToken(String token);
    boolean existsByEmail(String email);
    
    @Transactional
    void deleteByEmail(String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification e WHERE e.createdAt < ?1")
    void deleteAllExpiredTokens(LocalDateTime expirationTime);

    @Query("SELECT e FROM EmailVerification e WHERE e.email = :email AND e.token = :token AND e.createdAt > :cutoff")
    Optional<EmailVerification> findValidToken(
        @Param("email") String email,
        @Param("token") String token,
        @Param("cutoff") LocalDateTime cutoff
    );
} 