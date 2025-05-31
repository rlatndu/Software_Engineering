package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.RecentSiteVisit;
import com.example.softwareengineering.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecentSiteVisitRepository extends JpaRepository<RecentSiteVisit, Long> {
    @Query("SELECT DISTINCT rsv.site FROM RecentSiteVisit rsv " +
           "WHERE rsv.user.id = :userId " +
           "ORDER BY rsv.visitedAt DESC")
    List<Site> findRecentSitesByUserId(@Param("userId") Long userId);
} 