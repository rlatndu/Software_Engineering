package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    boolean existsByName(String name);
    boolean existsByNameAndOwner(String name, User owner);
    
    @Query("SELECT DISTINCT s FROM Site s LEFT JOIN FETCH s.members m WHERE s.owner = :user OR m.user = :user")
    List<Site> findByOwnerOrMember(@Param("user") User user);
    
    List<Site> findByOwner(User owner);
} 