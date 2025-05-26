package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.NotificationDto;
import com.example.softwareengineering.entity.Notification;
import com.example.softwareengineering.entity.NotificationType;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional
    public NotificationDto createNotification(User user, NotificationType type, String content, String targetUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .content(content)
                .targetUrl(targetUrl)
                .checked(false)
                .build();
        return convertToDto(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToDto);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인 알림만 삭제할 수 있습니다.");
        }
        notificationRepository.delete(notification);
    }

    @Transactional
    public void checkNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인 알림만 확인할 수 있습니다.");
        }
        notification.setChecked(true);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public long getUncheckedCount(Long userId) {
        return notificationRepository.countByUserIdAndCheckedFalse(userId);
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .content(notification.getContent())
                .targetUrl(notification.getTargetUrl())
                .checked(notification.isChecked())
                .createdAt(notification.getCreatedAt())
                .build();
    }
} 