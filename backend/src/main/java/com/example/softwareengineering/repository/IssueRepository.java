package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByProject(Project project);
} 