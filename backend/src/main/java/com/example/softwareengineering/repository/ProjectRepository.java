package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findBySite(Site site);
    boolean existsByKey(String key);
    Optional<Project> findByKey(String key);
    
    @Modifying
    @Query("DELETE FROM Project p WHERE p.site = :site")
    void deleteBySite(Site site);
} 