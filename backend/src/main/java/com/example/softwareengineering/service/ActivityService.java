package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.ActivityDto;
import com.example.softwareengineering.entity.Activity;
import com.example.softwareengineering.entity.ActivityType;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final ActivityRepository activityRepository;

    @Transactional
    public void recordActivity(User user, ActivityType type, String content, String targetUrl) {
        Activity activity = Activity.builder()
                .user(user)
                .type(type)
                .content(content)
                .targetUrl(targetUrl)
                .build();
        activityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityDto> getActivities(Long userId, Pageable pageable) {
        Page<Activity> activities = activityRepository.findByUserId(userId, pageable);
        return activities.map(this::convertToDto);
    }

    @Scheduled(cron = "0 0 0 * * ?") // 매일 자정에 실행
    @Transactional
    public void deleteOldActivities() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        activityRepository.deleteByCreatedAtBefore(thirtyDaysAgo);
    }

    private ActivityDto convertToDto(Activity activity) {
        return ActivityDto.builder()
                .id(activity.getId())
                .userId(activity.getUser().getId())
                .userName(activity.getUser().getUserId())
                .userProfileImage(activity.getUser().getProfileImage())
                .type(activity.getType())
                .content(activity.getContent())
                .targetUrl(activity.getTargetUrl())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}