package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.CustomIssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomIssueStatusRepository extends JpaRepository<CustomIssueStatus, Long> {
    List<CustomIssueStatus> findByProjectId(Long projectId);
    boolean existsByNameAndProjectId(String name, Long projectId);
} 