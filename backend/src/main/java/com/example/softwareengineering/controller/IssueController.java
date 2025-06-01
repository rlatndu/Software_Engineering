package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.IssueCreateRequest;
import com.example.softwareengineering.dto.IssueUpdateRequest;
import com.example.softwareengineering.dto.IssueResponse;
import com.example.softwareengineering.dto.AttachmentResponse;
import com.example.softwareengineering.dto.IssueOrderUpdateRequest;
import com.example.softwareengineering.dto.SubIssueRequest;
import com.example.softwareengineering.dto.SubIssueResponse;
import com.example.softwareengineering.entity.Attachment;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.repository.AttachmentRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.service.IssueService;
import com.example.softwareengineering.service.SubIssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.softwareengineering.exception.CustomException;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

@Tag(name = "이슈 관리", description = "이슈 생성, 수정, 삭제, 첨부파일, 하위이슈 등 이슈 관련 API")
@RestController
@RequestMapping("/api/projects/{projectId}/issues")
public class IssueController {
    private static final Logger log = LoggerFactory.getLogger(IssueController.class);

    @Autowired
    private IssueService issueService;
    @Autowired
    private IssueRepository issueRepository;
    @Autowired
    private AttachmentRepository attachmentRepository;
    @Autowired
    private SubIssueService subIssueService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @Operation(summary = "이슈 생성", description = "새로운 이슈를 생성합니다.")
    public ResponseEntity<?> createIssue(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId,
            @Parameter(description = "이슈 생성 정보") @RequestBody IssueCreateRequest request) {
        try {
            log.info("이슈 생성 요청: projectId={}, request={}", projectId, request);
            request.setProjectId(projectId);  // URL의 projectId를 request에 설정
            IssueResponse response = issueService.createIssue(request);
            return ResponseEntity.ok(response);
        } catch (CustomException e) {
            log.error("이슈 생성 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("이슈 생성 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @Operation(summary = "프로젝트별 이슈 목록 조회", description = "projectId로 해당 프로젝트의 이슈 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    @GetMapping("/list")
    public ResponseEntity<?> getIssuesByProject(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId) {
        try {
            log.info("이슈 목록 조회 요청: projectId={}", projectId);
            List<IssueResponse> issues = issueService.getIssuesByProject(projectId);
            return ResponseEntity.ok(issues);
        } catch (CustomException e) {
            log.error("이슈 목록 조회 실패: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("이슈 목록 조회 중 오류 발생", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @Operation(summary = "이슈 수정", description = "이슈 담당자, ADMIN, PM이 수정할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "수정 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PutMapping("/{issueId}")
    public ResponseEntity<?> updateIssue(
            @PathVariable Long issueId,
            @RequestBody IssueUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUserId(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
            IssueResponse response = issueService.updateIssue(issueId, request, user.getId());
            return ResponseEntity.ok(response);
        } catch (CustomException e) {
            log.error("이슈 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("이슈 수정 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "서버 내부 오류가 발생했습니다."));
        }
    }

    @Operation(summary = "이슈 삭제", description = "이슈 담당자, ADMIN, PM이 삭제할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @DeleteMapping("/{issueId}")
    public ResponseEntity<?> deleteIssue(
            @PathVariable Long issueId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUserId(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
            issueService.deleteIssue(issueId, user.getId());
            return ResponseEntity.ok(Map.of("message", "이슈가 삭제되었습니다."));
        } catch (CustomException e) {
            log.error("이슈 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("이슈 삭제 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "서버 내부 오류가 발생했습니다."));
        }
    }

    @Operation(summary = "이슈 첨부파일 업로드", description = "이슈에 첨부파일을 업로드합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "업로드 성공"),
        @ApiResponse(responseCode = "404", description = "이슈 없음")
    })
    @PostMapping("/{issueId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadAttachment(@PathVariable Long issueId, @RequestParam("file") MultipartFile file) throws Exception {
        Issue issue = issueRepository.findById(issueId).orElseThrow(() -> new RuntimeException("이슈를 찾을 수 없습니다."));
        // 파일 저장 경로
        String uploadDir = "uploads/issue/" + issueId;
        Files.createDirectories(Paths.get(uploadDir));
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        file.transferTo(filePath);
        // DB 저장
        Attachment attachment = new Attachment();
        attachment.setIssue(issue);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(filePath.toString());
        attachment.setUploadedAt(LocalDateTime.now());
        attachment = attachmentRepository.save(attachment);
        // 응답 DTO
        AttachmentResponse response = new AttachmentResponse();
        response.setId(attachment.getId());
        response.setFileName(attachment.getFileName());
        response.setFileUrl("/api/issues/" + issueId + "/attachments/" + attachment.getId());
        response.setUploadedAt(attachment.getUploadedAt());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "이슈 첨부파일 다운로드", description = "첨부파일을 다운로드합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "다운로드 성공"),
        @ApiResponse(responseCode = "404", description = "첨부파일 없음")
    })
    @GetMapping("/{issueId}/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long issueId, @PathVariable Long attachmentId) throws Exception {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("첨부파일을 찾을 수 없습니다."));
        if (!attachment.getIssue().getId().equals(issueId)) {
            return ResponseEntity.badRequest().build();
        }
        Path filePath = Paths.get(attachment.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
            .body(resource);
    }

    @Operation(summary = "이슈 우선순위 일괄 변경", description = "이슈 리스트의 order(우선순위)를 한 번에 변경합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "변경 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @PatchMapping("/order")
    public ResponseEntity<String> updateIssueOrders(@RequestBody java.util.List<IssueOrderUpdateRequest> orderList, @RequestParam Long userId) {
        issueService.updateIssueOrders(orderList, userId);
        return ResponseEntity.ok("이슈 우선순위가 변경되었습니다.");
    }

    @Operation(summary = "하위이슈 생성", description = "이슈 담당자만 하위이슈를 생성할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "생성 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PostMapping("/{issueId}/subissues")
    public ResponseEntity<SubIssueResponse> createSubIssue(@PathVariable Long issueId, @RequestBody SubIssueRequest request, @RequestParam Long userId) {
        SubIssueResponse response = subIssueService.createSubIssue(issueId, request, userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "하위이슈 삭제", description = "이슈 담당자만 하위이슈를 삭제할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @DeleteMapping("/subissues/{subIssueId}")
    public ResponseEntity<String> deleteSubIssue(@PathVariable Long subIssueId, @RequestParam Long userId) {
        subIssueService.deleteSubIssue(subIssueId, userId);
        return ResponseEntity.ok("하위이슈가 삭제되었습니다.");
    }

    @Operation(summary = "하위이슈 체크/해제", description = "이슈 담당자만 하위이슈의 체크 상태를 변경할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "변경 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PatchMapping("/subissues/{subIssueId}/check")
    public ResponseEntity<SubIssueResponse> checkSubIssue(@PathVariable Long subIssueId, @RequestParam boolean checked, @RequestParam Long userId) {
        SubIssueResponse response = subIssueService.checkSubIssue(subIssueId, checked, userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "하위이슈 목록 조회", description = "이슈 담당자만 하위이슈 목록을 조회할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping("/{issueId}/subissues")
    public ResponseEntity<java.util.List<SubIssueResponse>> getSubIssues(@PathVariable Long issueId, @RequestParam Long userId) {
        java.util.List<SubIssueResponse> list = subIssueService.getSubIssues(issueId, userId);
        return ResponseEntity.ok(list);
    }
} 