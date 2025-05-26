package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.SubIssue;
import com.example.softwareengineering.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubIssueRepository extends JpaRepository<SubIssue, Long> {
    List<SubIssue> findByParentIssue(Issue parentIssue);
} 