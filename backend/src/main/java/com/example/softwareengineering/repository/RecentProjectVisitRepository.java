package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.RecentProjectVisit;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecentProjectVisitRepository extends JpaRepository<RecentProjectVisit, Long> {
    @Query("SELECT p FROM Project p WHERE p.id IN " +
           "(SELECT DISTINCT rpv.project.id FROM RecentProjectVisit rpv " +
           "WHERE rpv.project.site.id = :siteId " +
           "AND rpv.user.id = :userId) " +
           "ORDER BY (SELECT MAX(rv.visitedAt) FROM RecentProjectVisit rv WHERE rv.project = p) DESC")
    List<Project> findRecentProjectsBySiteIdAndUserId(@Param("siteId") Long siteId, @Param("userId") Long userId);

    @Query("SELECT p FROM Project p WHERE p.id IN " +
           "(SELECT DISTINCT rpv.project.id FROM RecentProjectVisit rpv " +
           "WHERE rpv.project.site.id = :siteId) " +
           "ORDER BY (SELECT MAX(rv.visitedAt) FROM RecentProjectVisit rv WHERE rv.project = p) DESC")
    List<Project> findRecentProjectsBySiteId(@Param("siteId") Long siteId);

    @Query("SELECT rpv FROM RecentProjectVisit rpv " +
           "WHERE rpv.project.site.id = :siteId " +
           "AND rpv.user.id = :userId " +
           "ORDER BY rpv.visitedAt DESC")
    List<RecentProjectVisit> findByUserAndSite(@Param("userId") Long userId, @Param("siteId") Long siteId);

    @Modifying
    @Query("DELETE FROM RecentProjectVisit rpv WHERE rpv.project.site.id = :siteId")
    void deleteBySiteId(Long siteId);

    @Modifying
    @Query("DELETE FROM RecentProjectVisit rpv WHERE rpv.project.site.id = :siteId")
    void deleteByProjectSiteId(Long siteId);

    @Modifying
    @Query("DELETE FROM RecentProjectVisit r WHERE r.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
} 