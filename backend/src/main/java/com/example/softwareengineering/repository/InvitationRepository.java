package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Invitation;
import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    List<Invitation> findBySite(Site site);
    List<Invitation> findByProject(Project project);
    Optional<Invitation> findByInviteeEmailAndProject(String email, Project project);
    boolean existsByInviteeEmailAndProject(String email, Project project);
    Optional<Invitation> findByToken(String token);
    
    @Modifying
    void deleteBySite(Site site);
} 