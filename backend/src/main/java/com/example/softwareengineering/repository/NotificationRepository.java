package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndCheckedFalse(Long userId);
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.targetUrl LIKE CONCAT('%/sites/', :siteId, '%')")
    void deleteBySiteId(Long siteId);
    
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.targetUrl LIKE CONCAT('%/projects/', :projectId, '/%')")
    void deleteByProjectId(@Param("projectId") Long projectId);
} 