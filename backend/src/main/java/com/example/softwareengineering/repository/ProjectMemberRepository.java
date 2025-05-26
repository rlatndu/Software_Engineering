package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    boolean existsByProjectAndUser(Project project, User user);
} 