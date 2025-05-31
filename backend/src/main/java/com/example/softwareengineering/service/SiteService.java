package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.RecentSiteVisit;
import com.example.softwareengineering.repository.SiteRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.BoardColumnRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.RecentSiteVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SiteService {
    private final SiteRepository siteRepository;
    private final SiteMemberRepository siteMemberRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final RecentSiteVisitRepository recentSiteVisitRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Site createSite(String name, User owner) {
        // 이름 유효성 검사
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("사이트 이름은 필수입니다.");
        }

        name = name.trim();

        // 이름 길이 검사
        if (name.length() > 30) {
            throw new IllegalArgumentException("사이트 이름은 30자를 초과할 수 없습니다.");
        }

        // 특수문자 검사
        if (!name.matches("^[가-힣a-zA-Z0-9\\s]+$")) {
            throw new IllegalArgumentException("사이트 이름에 특수문자를 사용할 수 없습니다.");
        }

        // 중복 검사
        if (siteRepository.existsByNameAndOwner(name, owner)) {
            throw new IllegalArgumentException("이미 동일한 이름의 사이트가 존재합니다.");
        }
        
        Site site = Site.builder()
                .name(name)
                .owner(owner)
                .createdAt(LocalDateTime.now())
                .build();
        
        site = siteRepository.save(site);

        // 사이트 생성자를 ADMIN 멤버로 자동 등록
        SiteMember member = SiteMember.builder()
                .site(site)
                .user(owner)
                .role(MemberRole.ADMIN)
                .build();
        
        siteMemberRepository.save(member);
        site.addMember(member);

        return site;
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByOwner(User user) {
        return siteRepository.findByOwnerOrMember(user);
    }

    public Site getSiteById(Long siteId) {
        return siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public boolean isUserSiteMember(User user, Site site) {
        // 소유자인 경우
        if (site.getOwner().getId().equals(user.getId())) {
            return true;
        }
        
        // 멤버인 경우
        return siteMemberRepository.existsBySiteAndUser(site, user);
    }

    @Transactional
    public void deleteSite(Long siteId, User user) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));

        // 사이트 소유자 또는 ADMIN 권한을 가진 멤버인지 확인
        SiteMember member = siteMemberRepository.findBySiteAndUser(site, user)
                .orElseThrow(() -> new IllegalArgumentException("권한이 없습니다."));

        if (!site.getOwner().getId().equals(user.getId()) && member.getRole() != MemberRole.ADMIN) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        try {
            // 1. 프로젝트 관련 데이터 삭제
            List<Project> projects = projectRepository.findBySite(site);
            for (Project project : projects) {
                // 1-1. 이슈 삭제
                issueRepository.deleteByProject(project);
                
                // 1-2. 보드 컬럼 삭제
                boardColumnRepository.deleteByProject(project);
                
                // 1-3. 프로젝트 멤버 삭제
                projectMemberRepository.deleteByProject(project);
            }

            // 2. 프로젝트 삭제
            projectRepository.deleteBySite(site);
            
            // 3. 사이트 멤버 삭제
            siteMemberRepository.deleteBySite(site);
            
            // 4. 사이트 삭제
            siteRepository.delete(site);
        } catch (Exception e) {
            throw new RuntimeException("사이트 삭제에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void recordSiteVisit(Long siteId, Long userId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        RecentSiteVisit visit = RecentSiteVisit.builder()
                .site(site)
                .user(user)
                .build();

        recentSiteVisitRepository.save(visit);
    }

    public List<Site> getRecentSites(Long userId) {
        return recentSiteVisitRepository.findRecentSitesByUserId(userId);
    }
} 