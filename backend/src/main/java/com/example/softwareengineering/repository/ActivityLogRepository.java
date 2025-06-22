package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.ActivityLog;
import com.example.softwareengineering.entity.Project;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    @Query("SELECT a FROM ActivityLog a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.project " +
           "WHERE a.user.id = :userId ORDER BY a.timestamp DESC")
    List<ActivityLog> findByUserIdOrderByTimestampDesc(Long userId);
    
    @Query("SELECT a FROM ActivityLog a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.project " +
           "WHERE a.project.id = :projectId ORDER BY a.timestamp DESC")
    List<ActivityLog> findByProjectIdOrderByTimestampDesc(Long projectId);
    
    @Query("SELECT a FROM ActivityLog a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.project " +
           "WHERE a.project = :project ORDER BY a.timestamp DESC")
    List<ActivityLog> findByProjectOrderByTimestampDesc(@Param("project") Project project);
    
    @Query("SELECT DISTINCT a FROM ActivityLog a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.project p " +
           "WHERE a.user.id = :userId AND (p IS NULL OR p.site.id = :siteId) " +
           "ORDER BY a.timestamp DESC")
    List<ActivityLog> findUserActivitiesInSite(
        @Param("userId") Long userId,
        @Param("siteId") Long siteId,
        Pageable pageable
    );

    @Query("SELECT DISTINCT a FROM ActivityLog a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.project p " +
           "WHERE (p IS NULL OR p.site.id = :siteId) " +
           "ORDER BY a.timestamp DESC")
    List<ActivityLog> findSiteMembersActivities(
        @Param("siteId") Long siteId,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT a FROM ActivityLog a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.project " +
           "WHERE a.user.id = :userId " +
           "ORDER BY a.timestamp DESC")
    List<ActivityLog> findRecentActivitiesByUser(
        @Param("userId") Long userId,
        Pageable pageable
    );
    
    @Query("SELECT a FROM ActivityLog a WHERE a.project.id = :projectId ORDER BY a.timestamp DESC")
    List<ActivityLog> findRecentActivitiesByProject(
        @Param("projectId") Long projectId,
        Pageable pageable
    );
    
    void deleteByTimestampBefore(LocalDateTime timestamp);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.project.site.id = :siteId")
    void deleteBySiteId(Long siteId);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
} 