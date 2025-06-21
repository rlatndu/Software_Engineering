package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.IssueStatus;
import com.example.softwareengineering.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByColumnAndIsActiveTrueOrderByOrderIndexAsc(BoardColumn column);
    List<Issue> findByProject(Project project);
    List<Issue> findByProjectAndIsActiveTrue(Project project);
    
    @Query("SELECT i FROM Issue i WHERE i.project = :project AND i.status = com.example.softwareengineering.entity.IssueStatus.TODO AND i.isActive = true")
    List<Issue> findByProjectAndStatus(@Param("project") Project project);
    
    @Query("SELECT i FROM Issue i WHERE i.project.site.id = :siteId AND i.assignee.id = :userId AND i.status = com.example.softwareengineering.entity.IssueStatus.TODO AND i.isActive = true ORDER BY i.dueDate ASC")
    List<Issue> findUnresolvedIssuesBySiteAndAssignee(@Param("siteId") Long siteId, @Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM Issue i WHERE i.project = :project")
    void deleteByProject(Project project);
} 