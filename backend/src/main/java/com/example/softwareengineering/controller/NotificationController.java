package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.NotificationDto;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "알림 관리", description = "알림 관리 API")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "알림 목록 조회")
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getId(), pageable));
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "알림 삭제")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{notificationId}/check")
    @Operation(summary = "알림 확인 처리")
    public ResponseEntity<Void> checkNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {
        notificationService.checkNotification(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unchecked-count")
    @Operation(summary = "미확인 알림 개수 조회")
    public ResponseEntity<Long> getUncheckedCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getUncheckedCount(user.getId()));
    }
} 