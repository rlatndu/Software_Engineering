package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.CustomIssueStatusDto;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.service.CustomIssueStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/statuses")
@RequiredArgsConstructor
@Tag(name = "업무 상태 관리", description = "업무 상태 관리 API")
public class CustomIssueStatusController {
    private final CustomIssueStatusService customIssueStatusService;

    @GetMapping
    @Operation(summary = "프로젝트의 커스텀 상태 목록 조회")
    public ResponseEntity<List<CustomIssueStatusDto>> getCustomStatuses(@PathVariable Long projectId) {
        return ResponseEntity.ok(customIssueStatusService.getCustomStatuses(projectId));
    }

    @PostMapping
    @Operation(summary = "새로운 커스텀 상태 추가")
    public ResponseEntity<CustomIssueStatusDto> createCustomStatus(
            @PathVariable Long projectId,
            @RequestParam String name,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(customIssueStatusService.createCustomStatus(projectId, name, user));
    }

    @PutMapping("/{statusId}")
    @Operation(summary = "커스텀 상태 이름 수정")
    public ResponseEntity<CustomIssueStatusDto> updateCustomStatus(
            @PathVariable Long projectId,
            @PathVariable Long statusId,
            @RequestParam String name,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(customIssueStatusService.updateCustomStatus(statusId, name, user));
    }

    @DeleteMapping("/{statusId}")
    @Operation(summary = "커스텀 상태 삭제")
    public ResponseEntity<Void> deleteCustomStatus(
            @PathVariable Long projectId,
            @PathVariable Long statusId,
            @AuthenticationPrincipal User user) {
        customIssueStatusService.deleteCustomStatus(statusId, user);
        return ResponseEntity.ok().build();
    }
} 