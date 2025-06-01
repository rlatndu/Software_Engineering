package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Comment;
import com.example.softwareengineering.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueOrderByCreatedAtDesc(Issue issue);
    boolean existsByIdAndAuthor_UserId(Long id, String userId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.issue = :issue")
    void deleteByIssue(@Param("issue") Issue issue);
} 