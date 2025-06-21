package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.ProjectDTO;
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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

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
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> request) {
        try {
            Long siteId = Long.valueOf(request.get("siteId").toString());
            String name = (String) request.get("name");
            String key = (String) request.get("key");
            boolean isPrivate = (boolean) request.get("isPrivate");
            Long creatorId = Long.valueOf(request.get("creatorId").toString());
            String creatorRole = (String) request.get("creatorRole");

            ProjectDTO projectDTO = projectService.createProject(siteId, name, key, isPrivate, creatorId, creatorRole);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", projectDTO);
            response.put("message", "프로젝트가 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "프로젝트 생성에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "프로젝트 삭제", description = "프로젝트를 삭제합니다. (프로젝트 관리자만 가능)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "프로젝트 삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<Map<String, Object>> deleteProject(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        try {
            projectService.deleteProject(projectId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "프로젝트가 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "프로젝트 삭제에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "사이트의 프로젝트 목록 조회", description = "특정 사이트의 모든 프로젝트를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<Map<String, Object>> getProjectsBySite(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId) {
        try {
            List<ProjectDTO> projects = projectService.getProjectsBySite(siteId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("projects", projects);
            response.put("count", projects.size());
            response.put("message", "프로젝트 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "프로젝트 목록 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/key/{key}")
    @Operation(summary = "프로젝트 키로 조회", description = "프로젝트 키로 프로젝트를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<ProjectDTO> getProjectByKey(
            @Parameter(description = "프로젝트 키") @PathVariable String key) {
        Project project = projectService.getProjectByKey(key);
        return ResponseEntity.ok(ProjectDTO.from(project));
    }

    @GetMapping("/site/{siteId}/recent")
    @Operation(summary = "사이트의 최근 프로젝트 목록 조회", description = "특정 사이트의 최근 프로젝트를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<Map<String, Object>> getRecentProjects(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "false") boolean onlyMine) {
        try {
            List<ProjectDTO> recentProjects = projectService.getRecentProjects(siteId, userId, onlyMine);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", recentProjects);
            response.put("message", "최근 프로젝트 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "최근 프로젝트 목록 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/site/{siteId}/recent-works")
    @Operation(summary = "사이트의 최근 작업 목록 조회", description = "특정 사이트의 최근 작업을 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<Map<String, Object>> getRecentWorks(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId) {
        try {
            List<Map<String, Object>> recentWorks = projectService.getRecentWorks(siteId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", recentWorks);
            response.put("message", "최근 작업 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "최근 작업 목록 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PostMapping("/{projectId}/visit")
    @Operation(summary = "프로젝트 방문 기록", description = "프로젝트 방문을 기록합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "기록 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 또는 사용자 없음")
    })
    public ResponseEntity<Map<String, Object>> recordVisit(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        try {
            projectService.recordProjectVisit(projectId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "프로젝트 방문이 기록되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "프로젝트 방문 기록에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/site/{siteId}/unresolved")
    @Operation(summary = "사이트의 미해결 이슈 목록 조회", description = "특정 사이트의 미해결 이슈를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<Map<String, Object>> getUnresolvedIssues(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        try {
            List<Map<String, Object>> unresolvedIssues = projectService.getUnresolvedIssues(siteId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", unresolvedIssues);
            response.put("message", "미해결 이슈 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "미해결 이슈 목록 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
} 