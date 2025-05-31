package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.dto.MembershipChangeRoleRequest;
import com.example.softwareengineering.service.SiteMemberService;
import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.repository.SiteRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.exception.CustomException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@Tag(name = "사이트 멤버 관리", description = "사이트 멤버 초대/역할변경/삭제 API")
@RestController
@RequestMapping("/api/sites")
public class SiteMemberController {

    @Autowired
    private SiteMemberService siteMemberService;
    
    @Autowired
    private SiteRepository siteRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SiteMemberRepository siteMemberRepository;

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

    @Operation(summary = "사이트 멤버 역할 조회", description = "특정 사용자의 사이트 멤버 역할을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "멤버 없음")
    })
    @GetMapping("/{siteId}/members/{userId}/check-role")
    public Map<String, Object> checkRole(
            @PathVariable Long siteId,
            @PathVariable String userId
    ) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        
        // userId가 숫자인 경우 ID로 조회, 아닌 경우 userId로 조회
        User user;
        try {
            Long id = Long.parseLong(userId);
            user = userRepository.findById(id)
                    .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
        } catch (NumberFormatException e) {
            user = userRepository.findByUserId(userId)
                    .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
        }
                
        SiteMember member = siteMemberRepository.findBySiteAndUser(site, user)
                .orElseThrow(() -> new CustomException("사이트 멤버가 아닙니다."));
                
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("role", member.getRole().toString());
        return response;
    }
} 