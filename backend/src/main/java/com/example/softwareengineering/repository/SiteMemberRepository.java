package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteMemberRepository extends JpaRepository<SiteMember, Long> {
    boolean existsBySiteAndUser(Site site, User user);
    Optional<SiteMember> findBySiteAndUser(Site site, User user);
    List<SiteMember> findByUser(User user);
    List<SiteMember> findBySiteAndRole(Site site, MemberRole role);
    
    @Modifying
    @Query("DELETE FROM SiteMember sm WHERE sm.site = :site")
    void deleteBySite(Site site);
} 