package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.dto.MembershipChangeRoleRequest;
import com.example.softwareengineering.service.SiteMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "사이트 멤버 관리", description = "사이트 멤버 초대/역할변경/삭제 API")
@RestController
@RequestMapping("/api/sites")
public class SiteMemberController {

    @Autowired
    private SiteMemberService siteMemberService;

    @Operation(summary = "사이트 멤버 초대", description = "ADMIN만 사이트에 멤버를 초대할 수 있습니다. userId(닉네임)로 초대합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "초대 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PostMapping("/{siteId}/invite")
    public Map<String, String> inviteMember(
            @PathVariable Long siteId,
            @RequestBody MembershipInviteRequest request
    ) {
        request.setSiteId(siteId);
        String result = siteMemberService.inviteMember(request);
        return Map.of("message", result);
    }

    @Operation(summary = "사이트 멤버 역할 변경", description = "ADMIN만 사이트 멤버의 역할을 변경할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "변경 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PatchMapping("/{siteId}/members/{userId}/role")
    public Map<String, String> changeRole(
            @PathVariable Long siteId,
            @PathVariable String userId,
            @RequestBody MembershipChangeRoleRequest request
    ) {
        String roleStr = request.getRole();
        Long changerId = request.getChangerId();
        com.example.softwareengineering.entity.MemberRole newRole = com.example.softwareengineering.entity.MemberRole.valueOf(roleStr);
        String result = siteMemberService.changeRole(siteId, userId, newRole, changerId);
        return Map.of("message", result);
    }

    @Operation(summary = "사이트 멤버 삭제", description = "ADMIN만 사이트 멤버를 삭제할 수 있습니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "삭제 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @DeleteMapping("/{siteId}/members/{userId}")
    public Map<String, String> removeMember(
            @PathVariable Long siteId,
            @PathVariable String userId,
            @RequestParam Long removerId
    ) {
        String result = siteMemberService.removeMember(siteId, userId, removerId);
        return Map.of("message", result);
    }
} 