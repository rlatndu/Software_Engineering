package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Attachment;
import com.example.softwareengineering.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByIssue(Issue issue);
} 