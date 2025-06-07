package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.ActivityLogRequestDTO;
import com.example.softwareengineering.entity.ActivityLog;
import com.example.softwareengineering.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createActivityLog(@RequestBody ActivityLogRequestDTO requestDTO) {
        try {
            ActivityLog activityLog = activityLogService.createActivityLog(requestDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", activityLog);
            response.put("message", "활동 내역이 성공적으로 저장되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "활동 내역 저장에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<Map<String, Object>> getSiteActivities(
            @PathVariable Long siteId,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "30") int limit) {
        try {
            List<ActivityLog> activities;
            if (userId != null) {
                // 특정 사용자의 사이트 내 활동
                activities = activityLogService.getUserActivitiesInSite(userId, siteId, limit);
            } else {
                // 사이트 멤버들의 전체 활동
                activities = activityLogService.getSiteMembersActivities(siteId, limit);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", activities);
            response.put("message", "활동 내역을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "활동 내역 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/project/{projectId}/recent")
    public ResponseEntity<Map<String, Object>> getProjectRecentActivities(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "30") int limit) {
        try {
            List<ActivityLog> activities = activityLogService.getActivityLogs(projectId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", activities);
            response.put("message", "프로젝트 활동 내역을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "프로젝트 활동 내역 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldActivities() {
        try {
            activityLogService.cleanupOldActivities();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "오래된 활동 내역이 성공적으로 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "오래된 활동 내역 삭제에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
} 