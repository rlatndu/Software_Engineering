package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.RecentWork;
import com.example.softwareengineering.entity.RecentWork.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecentWorkRepository extends JpaRepository<RecentWork, Long> {
    @Query("SELECT rw FROM RecentWork rw " +
           "WHERE rw.project.site.id = :siteId " +
           "ORDER BY rw.createdAt DESC")
    List<RecentWork> findRecentWorksBySiteId(@Param("siteId") Long siteId);

    @Query("SELECT rw FROM RecentWork rw " +
           "WHERE rw.project.site.id = :siteId " +
           "AND rw.user.id = :userId " +
           "ORDER BY rw.createdAt DESC")
    List<RecentWork> findByUserAndSite(@Param("userId") Long userId, @Param("siteId") Long siteId);

    @Query("SELECT rw FROM RecentWork rw " +
           "WHERE rw.project.site.id = :siteId " +
           "AND rw.activityType = :activityType " +
           "ORDER BY rw.createdAt DESC")
    List<RecentWork> findByActivityType(@Param("siteId") Long siteId, @Param("activityType") ActivityType activityType);

    @Query("SELECT rw FROM RecentWork rw " +
           "WHERE rw.project.site.id = :siteId " +
           "AND rw.user.id = :userId " +
           "AND rw.activityType = :activityType " +
           "ORDER BY rw.createdAt DESC")
    List<RecentWork> findByUserAndActivityType(
        @Param("siteId") Long siteId, 
        @Param("userId") Long userId, 
        @Param("activityType") ActivityType activityType
    );

    @Modifying
    @Query("DELETE FROM RecentWork rw WHERE rw.expiryDate < :now")
    void deleteExpiredRecords(@Param("now") LocalDateTime now);
} 