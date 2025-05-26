package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    Page<Activity> findByUserId(Long userId, Pageable pageable);
    
    @Modifying
    @Query("DELETE FROM Activity a WHERE a.createdAt < :date")
    void deleteByCreatedAtBefore(LocalDateTime date);
}