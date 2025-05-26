package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.CustomIssueStatusDto;
import com.example.softwareengineering.entity.CustomIssueStatus;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.CustomIssueStatusRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomIssueStatusService {
    private final CustomIssueStatusRepository customIssueStatusRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<CustomIssueStatusDto> getCustomStatuses(Long projectId) {
        return customIssueStatusRepository.findByProjectId(projectId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomIssueStatusDto createCustomStatus(Long projectId, String name, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("프로젝트를 찾을 수 없습니다."));

        // 프로젝트 관리자 권한 체크
        if (!project.getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(user.getId()) 
                        && member.getRole().equals(MemberRole.PM))) {
            throw new CustomException("프로젝트 관리자만 상태를 추가할 수 있습니다.");
        }

        // 중복 체크
        if (customIssueStatusRepository.existsByNameAndProjectId(name, projectId)) {
            throw new CustomException("이미 존재하는 상태 이름입니다.");
        }

        CustomIssueStatus status = CustomIssueStatus.builder()
                .name(name)
                .project(project)
                .build();

        return convertToDto(customIssueStatusRepository.save(status));
    }

    @Transactional
    public CustomIssueStatusDto updateCustomStatus(Long statusId, String name, User user) {
        CustomIssueStatus status = customIssueStatusRepository.findById(statusId)
                .orElseThrow(() -> new CustomException("상태를 찾을 수 없습니다."));

        // 프로젝트 관리자 권한 체크
        if (!status.getProject().getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(user.getId()) 
                        && member.getRole().equals(MemberRole.PM))) {
            throw new CustomException("프로젝트 관리자만 상태를 수정할 수 있습니다.");
        }

        // 중복 체크
        if (customIssueStatusRepository.existsByNameAndProjectId(name, status.getProject().getId())) {
            throw new CustomException("이미 존재하는 상태 이름입니다.");
        }

        status.setName(name);
        return convertToDto(customIssueStatusRepository.save(status));
    }

    @Transactional
    public void deleteCustomStatus(Long statusId, User user) {
        CustomIssueStatus status = customIssueStatusRepository.findById(statusId)
                .orElseThrow(() -> new CustomException("상태를 찾을 수 없습니다."));

        // 프로젝트 관리자 권한 체크
        if (!status.getProject().getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(user.getId()) 
                        && member.getRole().equals(MemberRole.PM))) {
            throw new CustomException("프로젝트 관리자만 상태를 삭제할 수 있습니다.");
        }

        // 해당 상태를 사용하는 이슈가 있는지 확인
        if (!status.getIssues().isEmpty()) {
            throw new CustomException("해당 상태를 사용하는 이슈가 있어 삭제할 수 없습니다.");
        }

        customIssueStatusRepository.delete(status);
    }

    private CustomIssueStatusDto convertToDto(CustomIssueStatus status) {
        return CustomIssueStatusDto.builder()
                .id(status.getId())
                .name(status.getName())
                .projectId(status.getProject().getId())
                .createdAt(status.getCreatedAt())
                .updatedAt(status.getUpdatedAt())
                .build();
    }
} 