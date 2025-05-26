package com.example.softwareengineering.controller;

import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.service.SiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
@Tag(name = "사이트 관리", description = "사이트 생성 및 조회 API")
public class SiteController {
    private final SiteService siteService;
    private final UserRepository userRepository;

    private Map<String, Object> convertSiteToMap(Site site) {
        Map<String, Object> siteMap = new HashMap<>();
        siteMap.put("id", site.getId());
        siteMap.put("name", site.getName());
        
        Map<String, Object> ownerMap = new HashMap<>();
        ownerMap.put("id", site.getOwner().getId());
        ownerMap.put("email", site.getOwner().getEmail());
        ownerMap.put("userId", site.getOwner().getUserId());
        siteMap.put("owner", ownerMap);
        
        List<Map<String, Object>> membersList = site.getMembers().stream()
            .map(member -> {
                Map<String, Object> memberMap = new HashMap<>();
                memberMap.put("id", member.getUser().getId());
                memberMap.put("email", member.getUser().getEmail());
                memberMap.put("userId", member.getUser().getUserId());
                memberMap.put("role", member.getRole().toString());
                return memberMap;
            })
            .collect(Collectors.toList());
        siteMap.put("members", membersList);
        
        siteMap.put("createdAt", site.getCreatedAt());
        return siteMap;
    }

    @Operation(summary = "사이트 생성", description = "사이트 이름과 ownerId를 받아 사이트를 생성합니다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSite(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        Long ownerId = Long.parseLong(body.get("ownerId"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUserId(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));
        
        if (!currentUser.getId().equals(ownerId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        Site site = siteService.createSite(name, currentUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", convertSiteToMap(site));
        response.put("message", "사이트가 생성되었습니다.");
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 사이트 목록 조회", description = "현재 로그인한 사용자의 사이트 목록을 조회합니다.")
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMySites() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userRepository.findByUserId(auth.getName())
                    .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));
            
            List<Site> sites = siteService.getSitesByOwner(currentUser);
            
            List<Map<String, Object>> siteList = sites.stream()
                    .map(this::convertSiteToMap)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", siteList);
            response.put("totalCount", siteList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(400).body(errorResponse);
        }
    }

    @Operation(summary = "사이트 상세 정보 조회", description = "사이트 ID로 상세 정보를 조회합니다.")
    @GetMapping("/{siteId}")
    public ResponseEntity<Map<String, Object>> getSiteById(@PathVariable Long siteId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUserId(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));
        
        Site site = siteService.getSiteById(siteId);
        
        if (!siteService.isUserSiteMember(currentUser, site)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", convertSiteToMap(site));
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "사이트 삭제", description = "사이트 관리자만 삭제할 수 있습니다.")
    @DeleteMapping("/{siteId}")
    public ResponseEntity<Map<String, Object>> deleteSite(@PathVariable Long siteId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUserId(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("인증된 사용자를 찾을 수 없습니다."));
        
        siteService.deleteSite(siteId, currentUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "사이트가 삭제되었습니다.");
        
        return ResponseEntity.ok(response);
    }
} 