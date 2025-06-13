package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.ActivityDto;
import com.example.softwareengineering.dto.ActivityCreateRequest;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Tag(name = "활동 내역 관리", description = "활동 내역 관리 API")
public class ActivityController {
    private final ActivityService activityService;

    @PostMapping
    @Operation(summary = "활동 내역 생성")
    public ResponseEntity<ActivityDto> createActivity(@RequestBody ActivityCreateRequest request) {
        return ResponseEntity.ok(activityService.createActivity(request));
    }

    @GetMapping
    @Operation(summary = "활동 내역 조회")
    public ResponseEntity<Page<ActivityDto>> getActivities(
            @RequestParam(required = false) Long userId,
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        // userId가 지정되지 않은 경우 현재 로그인한 사용자의 활동 내역을 조회
        Long targetUserId = userId != null ? userId : user.getId();
        return ResponseEntity.ok(activityService.getActivities(targetUserId, pageable));
    }
} 