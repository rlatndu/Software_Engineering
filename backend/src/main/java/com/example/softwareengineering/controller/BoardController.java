package com.example.softwareengineering.controller;

import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "보드 관리", description = "프로젝트 보드, 칼럼, 이슈 관리 API")
public class BoardController {
    private final BoardService boardService;

    @GetMapping("/projects/{projectId}/columns")
    @Operation(summary = "프로젝트 칼럼 목록 조회", description = "프로젝트의 모든 칼럼을 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<?> getColumns(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId) {
        try {
            log.info("프로젝트 칼럼 목록 조회 요청: projectId={}", projectId);
            List<Map<String, Object>> columns = boardService.getColumns(projectId);
            return ResponseEntity.ok(columns);
        } catch (IllegalArgumentException e) {
            log.error("프로젝트 칼럼 목록 조회 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("프로젝트 칼럼 목록 조회 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/projects/{projectId}/issues")
    @Operation(summary = "프로젝트 이슈 목록 조회", description = "프로젝트의 모든 이슈를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<?> getIssues(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId) {
        try {
            log.info("프로젝트 이슈 목록 조회 요청: projectId={}", projectId);
            Map<String, List<Map<String, Object>>> issues = boardService.getIssues(projectId);
            return ResponseEntity.ok(issues);
        } catch (IllegalArgumentException e) {
            log.error("프로젝트 이슈 목록 조회 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("프로젝트 이슈 목록 조회 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/projects/{projectId}/columns")
    @Operation(summary = "새로운 칼럼 생성", description = "프로젝트에 새로운 칼럼을 생성합니다. ADMIN 또는 PM만 생성할 수 있습니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "생성 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<?> createColumn(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId,
            @RequestParam String title,
            @RequestParam(required = false) String icon,
            @RequestParam(required = false) Integer orderIndex,
            @AuthenticationPrincipal User user) {
        try {
            log.info("칼럼 생성 요청: projectId={}, title={}, orderIndex={}", projectId, title, orderIndex);
            
            // orderIndex가 null이면 마지막 순서로 설정
            if (orderIndex == null) {
                List<Map<String, Object>> columns = boardService.getColumns(projectId);
                orderIndex = columns.size() + 1;
            }
            
            BoardColumn column = boardService.createColumn(projectId, title, icon, orderIndex, user);
            
            Map<String, Object> columnMap = new HashMap<>();
            columnMap.put("id", column.getId());
            columnMap.put("title", column.getTitle());
            columnMap.put("icon", column.getIcon());
            columnMap.put("projectId", column.getProject().getId());
            columnMap.put("order", column.getOrderIndex());
            
            return ResponseEntity.ok(columnMap);
        } catch (IllegalArgumentException e) {
            log.error("칼럼 생성 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            log.error("칼럼 생성 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PutMapping("/columns/{columnId}")
    @Operation(summary = "칼럼 수정", description = "칼럼의 제목을 수정합니다. ADMIN 또는 PM만 수정할 수 있습니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "수정 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "칼럼 없음")
    })
    public ResponseEntity<?> updateColumn(
            @Parameter(description = "칼럼 ID") @PathVariable Long columnId,
            @RequestParam String title,
            @AuthenticationPrincipal User user) {
        try {
            log.info("칼럼 수정 요청: columnId={}, title={}", columnId, title);
            
            BoardColumn column = boardService.updateColumn(columnId, title, user);
            
            Map<String, Object> columnMap = new HashMap<>();
            columnMap.put("id", column.getId());
            columnMap.put("title", column.getTitle());
            columnMap.put("icon", column.getIcon());
            columnMap.put("projectId", column.getProject().getId());
            columnMap.put("order", column.getOrderIndex());
            
            return ResponseEntity.ok(columnMap);
        } catch (IllegalArgumentException e) {
            log.error("칼럼 수정 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            log.error("칼럼 수정 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @DeleteMapping("/columns/{columnId}")
    @Operation(summary = "칼럼 삭제", description = "칼럼을 삭제합니다. ADMIN 또는 PM만 삭제할 수 있습니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "칼럼 없음")
    })
    public ResponseEntity<?> deleteColumn(
            @Parameter(description = "칼럼 ID") @PathVariable Long columnId,
            @AuthenticationPrincipal User user) {
        try {
            log.info("칼럼 삭제 요청: columnId={}", columnId);
            
            boardService.deleteColumn(columnId, user);
            
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("칼럼 삭제 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            log.error("칼럼 삭제 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }
} 