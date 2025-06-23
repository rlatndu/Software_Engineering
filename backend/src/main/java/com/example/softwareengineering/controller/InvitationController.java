package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.dto.MembershipInviteResponse;
import com.example.softwareengineering.dto.InvitationResponse;
import com.example.softwareengineering.entity.Invitation;
import com.example.softwareengineering.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@Tag(name = "초대", description = "사이트 및 프로젝트 초대 관리 API")
public class InvitationController {

    @Autowired
    private InvitationService invitationService;

    @PostMapping("/site")
    @Operation(summary = "사이트 초대", description = "사이트 관리자가 프로젝트 관리자를 초대합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "초대 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    public ResponseEntity<MembershipInviteResponse> inviteToSite(@RequestBody MembershipInviteRequest request) {
        Invitation invitation = invitationService.inviteToSite(request.getSiteId(), request.getInviteeEmail(), request.getInviterId());
        MembershipInviteResponse response = new MembershipInviteResponse();
        response.setInvitationId(invitation.getId());
        response.setStatus(invitation.isAccepted() ? "ACCEPTED" : invitation.isRejected() ? "REJECTED" : "PENDING");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/project")
    @Operation(summary = "프로젝트 초대", description = "프로젝트 관리자가 일반 사용자를 초대합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "초대 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    public ResponseEntity<Map<String, Object>> inviteToProject(@RequestBody MembershipInviteRequest request) {
        Invitation invitation = invitationService.inviteToProject(
                request.getProjectId(),
                request.getInviteeEmail(),
                request.getInviterId(),
                request.getRole() != null ? com.example.softwareengineering.entity.MemberRole.valueOf(request.getRole()) : null);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "초대 메일이 발송되었습니다.",
                "invitationId", invitation.getId(),
                "status", invitation.isAccepted() ? "ACCEPTED" : invitation.isRejected() ? "REJECTED" : "PENDING"
        ));
    }

    @PostMapping("/{invitationId}/accept")
    @Operation(summary = "초대 수락", description = "초대를 수락합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "수락 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "404", description = "초대 없음")
    })
    public ResponseEntity<String> acceptInvitation(
            @Parameter(description = "초대 ID") @PathVariable Long invitationId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        invitationService.acceptInvitation(invitationId, userId);
        return ResponseEntity.ok("초대를 수락했습니다.");
    }

    @PostMapping("/{invitationId}/reject")
    @Operation(summary = "초대 거절", description = "초대를 거절합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "거절 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "404", description = "초대 없음")
    })
    public ResponseEntity<String> rejectInvitation(
            @Parameter(description = "초대 ID") @PathVariable Long invitationId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        invitationService.rejectInvitation(invitationId, userId);
        return ResponseEntity.ok("초대를 거절했습니다.");
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "사이트 초대 목록 조회", description = "사이트의 모든 초대 목록을 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "사이트 없음")
    })
    public ResponseEntity<List<InvitationResponse>> getSiteInvitations(
            @Parameter(description = "사이트 ID") @PathVariable Long siteId) {
        List<InvitationResponse> invitations = invitationService.getSiteInvitations(siteId);
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "프로젝트 초대 목록 조회", description = "프로젝트의 모든 초대 목록을 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    public ResponseEntity<List<InvitationResponse>> getProjectInvitations(
            @Parameter(description = "프로젝트 ID") @PathVariable Long projectId) {
        List<InvitationResponse> invitations = invitationService.getProjectInvitations(projectId);
        return ResponseEntity.ok(invitations);
    }

    @PostMapping("/accept-by-token")
    public ResponseEntity<Map<String, Object>> acceptByToken(@RequestParam String token) {
        invitationService.acceptInvitationByToken(token);
        return ResponseEntity.ok(Map.of("success", true, "message", "초대를 수락했습니다."));
    }

    @PostMapping("/reject-by-token")
    public ResponseEntity<Map<String, Object>> rejectByToken(@RequestParam String token) {
        invitationService.rejectInvitationByToken(token);
        return ResponseEntity.ok(Map.of("success", true, "message", "초대를 거절했습니다."));
    }
} 