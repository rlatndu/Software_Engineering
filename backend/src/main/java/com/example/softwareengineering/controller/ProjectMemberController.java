package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.dto.MembershipChangeRoleRequest;
import com.example.softwareengineering.service.ProjectMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "프로젝트 멤버 관리", description = "프로젝트 멤버 초대/역할변경/삭제 API")
@RestController
@RequestMapping("/api/projects")
public class ProjectMemberController {

    @Autowired
    private ProjectMemberService projectMemberService;

    @Operation(summary = "프로젝트 PM 초대", description = "ADMIN만 프로젝트에 PM을 초대할 수 있습니다. userId(닉네임)로 초대합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "초대 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PostMapping("/{projectId}/invite-pm")
    public Map<String, String> invitePm(
            @PathVariable Long projectId,
            @RequestBody MembershipInviteRequest request
    ) {
        request.setProjectId(projectId);
        String result = projectMemberService.invitePm(request);
        return Map.of("message", result);
    }

    @Operation(summary = "프로젝트 멤버 초대", description = "ADMIN 또는 PM만 프로젝트에 MEMBER를 초대할 수 있습니다. userId(닉네임)로 초대합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "초대 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PostMapping("/{projectId}/invite-member")
    public Map<String, String> inviteMember(
            @PathVariable Long projectId,
            @RequestBody MembershipInviteRequest request
    ) {
        request.setProjectId(projectId);
        String result = projectMemberService.inviteMember(request);
        return Map.of("message", result);
    }

    @Operation(summary = "프로젝트 멤버 역할 변경", description = "ADMIN 또는 PM만 프로젝트 멤버의 역할을 변경할 수 있습니다. PM은 MEMBER만 변경 가능.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "변경 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PatchMapping("/{projectId}/members/{userId}/role")
    public Map<String, String> changeRole(
            @PathVariable Long projectId,
            @PathVariable String userId,
            @RequestBody MembershipChangeRoleRequest request
    ) {
        String roleStr = request.getRole();
        Long changerId = request.getChangerId();
        com.example.softwareengineering.entity.MemberRole newRole = com.example.softwareengineering.entity.MemberRole.valueOf(roleStr);
        String result = projectMemberService.changeRole(projectId, userId, newRole, changerId);
        return Map.of("message", result);
    }

    @Operation(summary = "프로젝트 멤버 삭제", description = "ADMIN 또는 PM만 프로젝트 멤버를 삭제할 수 있습니다. PM은 MEMBER만 삭제 가능.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @DeleteMapping("/{projectId}/members/{userId}")
    public Map<String, String> removeMember(
            @PathVariable Long projectId,
            @PathVariable String userId,
            @RequestParam Long removerId
    ) {
        String result = projectMemberService.removeMember(projectId, userId, removerId);
        return Map.of("message", result);
    }
} 