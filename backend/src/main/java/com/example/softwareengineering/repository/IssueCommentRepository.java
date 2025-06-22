package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IssueCommentRepository extends JpaRepository<Comment, Long> {
    @Modifying
    @Query("DELETE FROM Comment c WHERE c.issue.project.id = :projectId")
    void deleteByProjectId(Long projectId);
} 