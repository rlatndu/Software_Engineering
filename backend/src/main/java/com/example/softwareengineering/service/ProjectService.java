package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional
    public Project createProject(Long siteId, String name, String key, boolean isPrivate, Long creatorId) {
        // 1. 사이트 존재 확인
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));

        // 2. 생성자 확인
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3. 프로젝트 이름 길이 검증
        if (name.length() > 30) {
            throw new IllegalArgumentException("프로젝트 이름은 30자를 초과할 수 없습니다.");
        }

        // 4. 프로젝트 키 형식 검증 (3~10자, 영문대문자/숫자)
        if (!key.matches("^[A-Z0-9]{3,10}$")) {
            throw new IllegalArgumentException("프로젝트 키는 3~10자의 영문대문자와 숫자만 사용 가능합니다.");
        }

        // 5. 프로젝트 키 중복 검증
        if (projectRepository.existsByKey(key)) {
            throw new IllegalArgumentException("이미 사용 중인 프로젝트 키입니다.");
        }

        // 6. 프로젝트 생성
        Project project = Project.builder()
                .name(name)
                .key(key)
                .site(site)
                .isPrivate(isPrivate)
                .createdAt(LocalDateTime.now())
                .createdBy(creator)
                .build();
        
        project = projectRepository.save(project);

        // 7. 프로젝트 생성자를 PM으로 등록
        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(creator)
                .role(MemberRole.PM)
                .build();
        
        projectMemberRepository.save(member);

        return project;
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        // 1. 프로젝트 존재 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 2. 삭제 권한 확인 (PM만 삭제 가능)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
                
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트 멤버가 아닙니다."));

        if (member.getRole() != MemberRole.PM) {
            throw new IllegalArgumentException("프로젝트 삭제 권한이 없습니다.");
        }

        // 3. 프로젝트 삭제
        projectRepository.delete(project);
    }

    public List<Project> getProjectsBySite(Long siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
        return projectRepository.findBySite(site);
    }

    public Project getProjectByKey(String key) {
        return projectRepository.findByKey(key)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
    }
} 