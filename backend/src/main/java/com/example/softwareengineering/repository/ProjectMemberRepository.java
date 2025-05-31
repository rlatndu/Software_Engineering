package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    boolean existsByProjectAndUser(Project project, User user);
    List<ProjectMember> findByProject(Project project);
    
    @Modifying
    @Query("DELETE FROM ProjectMember pm WHERE pm.project = :project")
    void deleteByProject(Project project);
} 