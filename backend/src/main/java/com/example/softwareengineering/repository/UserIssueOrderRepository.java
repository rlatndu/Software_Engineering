package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.UserIssueOrder;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserIssueOrderRepository extends JpaRepository<UserIssueOrder, Long> {
    List<UserIssueOrder> findByUserAndColumnOrderByOrderIndexAsc(User user, BoardColumn column);
    void deleteByIssueId(Long issueId);
    List<UserIssueOrder> findByColumnId(Long columnId);
    Optional<UserIssueOrder> findByUserAndIssueAndColumn(User user, Issue issue, BoardColumn column);
    
    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.user.userId = :userId AND uo.column = :column AND uo.issue.isActive = true ORDER BY uo.orderIndex ASC")
    List<UserIssueOrder> findByUserIdAndColumnOrderByOrderIndexAsc(@Param("userId") String userId, @Param("column") BoardColumn column);
    
    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.user.userId = :userId AND uo.column = :column AND uo.issue.isActive = true ORDER BY uo.orderIndex DESC")
    List<UserIssueOrder> findByUserIdAndColumnOrderByOrderIndexDesc(@Param("userId") String userId, @Param("column") BoardColumn column);
    
    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.user.userId = :userId AND uo.project = :project AND uo.issue.isActive = true ORDER BY uo.orderIndex ASC")
    List<UserIssueOrder> findByUserIdAndProjectOrderByOrderIndexAsc(@Param("userId") String userId, @Param("project") Project project);

    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.issue = :issue AND uo.column = :column AND uo.issue.isActive = true")
    List<UserIssueOrder> findByIssueAndColumn(@Param("issue") Issue issue, @Param("column") BoardColumn column);
    
    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.user.userId = :userId AND uo.issue = :issue AND uo.column = :column AND uo.issue.isActive = true")
    Optional<UserIssueOrder> findByUserIdAndIssueAndColumn(@Param("userId") String userId, @Param("issue") Issue issue, @Param("column") BoardColumn column);
    
    @Query("SELECT uo FROM UserIssueOrder uo WHERE uo.user.id = :userId AND uo.issue = :issue AND uo.issue.isActive = true")
    Optional<UserIssueOrder> findByUserAndIssue(@Param("userId") Long userId, @Param("issue") Issue issue);
    
    @Query("DELETE FROM UserIssueOrder uo WHERE uo.project = :project")
    void deleteByProject(@Param("project") Project project);
} 