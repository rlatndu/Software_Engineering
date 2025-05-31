package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Comment;
import com.example.softwareengineering.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueOrderByCreatedAtDesc(Issue issue);
    boolean existsByIdAndAuthor_UserId(Long id, String userId);
} 