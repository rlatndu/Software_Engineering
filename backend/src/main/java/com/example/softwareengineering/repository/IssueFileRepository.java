package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IssueFileRepository extends JpaRepository<Attachment, Long> {
    @Modifying
    @Query("DELETE FROM Attachment a WHERE a.issue.project.id = :projectId")
    void deleteByProjectId(Long projectId);
} 