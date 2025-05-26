package com.example.softwareengineering.controller;

import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "프로젝트 관리", description = "프로젝트 생성, 삭제, 조회 API")
public class ProjectController {
    private final ProjectService projectService;

    @PostMapping
    @Operation(summary = "프로젝트 생성", description = "새로운 프로젝트를 생성합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "프로젝트 생성 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    public ResponseEntity<Project> createProject(@RequestBody Map<String, Object> request) {
        Long siteId = Long.valueOf(request.get("siteId").toString());
        String name = (String) request.get("name");
        String key = (String) request.get("key");
        boolean isPrivate = (boolean) request.get("isPrivate");
        Long creatorId = Long.valueOf(request.get("creatorId").toString());

        Project project = projectService.createProject(siteId, name, key, isPrivate, creatorId);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "프로젝트 삭제", description = "프로젝트를 삭제합니다. (프로젝트 관리자만 가능)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "프로젝트 삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<Map<String, String>> deleteProject(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        projectService.deleteProject(projectId, userId);
        return ResponseEntity.ok(Map.of("message", "프로젝트가 삭제되었습니다."));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "사이트의 프로젝트 목록 조회", description = "특정 사이트의 모든 프로젝트를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<Map<String, Object>> getProjectsBySite(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId) {
        var projects = projectService.getProjectsBySite(siteId);
        return ResponseEntity.ok(Map.of(
            "projects", projects,
            "count", projects.size()
        ));
    }

    @GetMapping("/key/{key}")
    @Operation(summary = "프로젝트 키로 조회", description = "프로젝트 키로 프로젝트를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<Project> getProjectByKey(
            @Parameter(description = "프로젝트 키") @PathVariable String key) {
        Project project = projectService.getProjectByKey(key);
        return ResponseEntity.ok(project);
    }
} 