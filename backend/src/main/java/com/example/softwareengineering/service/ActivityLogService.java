package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.ActivityLogRequestDTO;
import com.example.softwareengineering.dto.ActivityLogDTO;
import com.example.softwareengineering.entity.ActivityLog;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.repository.ActivityLogRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public ActivityLogDTO createActivityLog(ActivityLogRequestDTO requestDTO) {
        // User 엔티티 조회
        User user = userRepository.findById(requestDTO.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setType(requestDTO.getType());
        activityLog.setTitle(requestDTO.getTitle());
        activityLog.setContent(requestDTO.getContent());
        
        // Project 엔티티 조회 (있는 경우)
        if (requestDTO.getProjectId() != null) {
            Project project = projectRepository.findById(requestDTO.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
            activityLog.setProject(project);
        }

        activityLog.setIssueId(requestDTO.getIssueId());
        activityLog.setCommentId(requestDTO.getCommentId());
        activityLog.setTargetPage(requestDTO.getTargetPage());
        activityLog.setStatusChange(requestDTO.getStatusChange());

        ActivityLog saved = activityLogRepository.save(activityLog);
        return convertToDTO(saved);
    }

    public List<ActivityLogDTO> getActivityLogs(Long projectId) {
        List<ActivityLog> activities;
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
            activities = activityLogRepository.findByProjectOrderByTimestampDesc(project);
        } else {
            activities = activityLogRepository.findAll();
        }
        return activities.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ActivityLogDTO> getUserActivitiesInSite(Long userId, Long siteId, int limit) {
        return activityLogRepository.findUserActivitiesInSite(userId, siteId, PageRequest.of(0, limit))
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ActivityLogDTO> getSiteMembersActivities(Long siteId, int limit) {
        return activityLogRepository.findSiteMembersActivities(siteId, PageRequest.of(0, limit))
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ActivityLogDTO> getUserRecentActivities(Long userId, int limit) {
        return activityLogRepository.findRecentActivitiesByUser(userId, PageRequest.of(0, limit))
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ActivityLogDTO> getProjectRecentActivities(Long projectId, int limit) {
        return activityLogRepository.findRecentActivitiesByProject(projectId, PageRequest.of(0, limit))
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // 매일 자정에 실행
    public void cleanupOldActivities() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        activityLogRepository.deleteByTimestampBefore(thirtyDaysAgo);
    }

    private ActivityLogDTO convertToDTO(ActivityLog activityLog) {
        ActivityLogDTO dto = new ActivityLogDTO();
        dto.setId(activityLog.getId());
        dto.setUserId(activityLog.getUser().getId());
        dto.setType(activityLog.getType());
        dto.setTitle(activityLog.getTitle());
        dto.setContent(activityLog.getContent());
        dto.setTimestamp(activityLog.getTimestamp());
        if (activityLog.getProject() != null) {
            dto.setProjectId(activityLog.getProject().getId());
            dto.setProjectName(activityLog.getProject().getName());
        }
        dto.setIssueId(activityLog.getIssueId());
        dto.setCommentId(activityLog.getCommentId());
        dto.setTargetPage(activityLog.getTargetPage());
        dto.setStatusChange(activityLog.getStatusChange());
        
        if (activityLog.getTimestamp() != null) {
            dto.setUpdatedAt(activityLog.getTimestamp().toString());
        }
        
        return dto;
    }
} 