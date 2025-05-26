package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SiteMemberService {
    private final SiteMemberRepository siteMemberRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addAdminToSite(Long siteId, Long userId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        if (!siteMemberRepository.existsBySiteAndUser(site, user)) {
            SiteMember member = SiteMember.builder()
                    .site(site)
                    .user(user)
                    .role(MemberRole.ADMIN)
                    .build();
            siteMemberRepository.save(member);
        }
    }

    @Transactional
    public String inviteMember(MembershipInviteRequest request) {
        Long siteId = request.getSiteId();
        String userId = request.getUserId();
        String roleStr = request.getRole();
        Long inviterId = request.getInviterId();

        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user == null) {
            return "존재하지 않는 사용자입니다.";
        }

        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new CustomException("초대자를 찾을 수 없습니다."));
        SiteMember inviterMember = siteMemberRepository.findBySiteAndUser(site, inviter)
                .orElseThrow(() -> new CustomException("초대자가 사이트 멤버가 아닙니다."));

        if (inviterMember.getRole() != MemberRole.ADMIN) {
            return "ADMIN만 초대할 수 있습니다.";
        }

        if (siteMemberRepository.existsBySiteAndUser(site, user)) {
            return "이미 멤버입니다.";
        }

        SiteMember member = SiteMember.builder()
                .site(site)
                .user(user)
                .role(MemberRole.valueOf(roleStr))
                .build();
        siteMemberRepository.save(member);

        return "멤버가 초대되었습니다.";
    }

    @Transactional
    public String changeRole(Long siteId, String userId, MemberRole newRole, Long changerId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user == null) {
            return "존재하지 않는 사용자입니다.";
        }

        User changer = userRepository.findById(changerId)
                .orElseThrow(() -> new CustomException("변경자를 찾을 수 없습니다."));
        SiteMember changerMember = siteMemberRepository.findBySiteAndUser(site, changer)
                .orElseThrow(() -> new CustomException("변경자가 사이트 멤버가 아닙니다."));

        if (changerMember.getRole() != MemberRole.ADMIN) {
            return "ADMIN만 역할을 변경할 수 있습니다.";
        }

        SiteMember member = siteMemberRepository.findBySiteAndUser(site, user)
                .orElseThrow(() -> new CustomException("해당 사용자는 멤버가 아닙니다."));
        member.setRole(newRole);
        siteMemberRepository.save(member);

        return "역할이 변경되었습니다.";
    }

    @Transactional
    public String removeMember(Long siteId, String userId, Long removerId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user == null) {
            return "존재하지 않는 사용자입니다.";
        }

        User remover = userRepository.findById(removerId)
                .orElseThrow(() -> new CustomException("삭제자를 찾을 수 없습니다."));
        SiteMember removerMember = siteMemberRepository.findBySiteAndUser(site, remover)
                .orElseThrow(() -> new CustomException("삭제자가 사이트 멤버가 아닙니다."));

        if (removerMember.getRole() != MemberRole.ADMIN) {
            return "ADMIN만 멤버를 삭제할 수 있습니다.";
        }

        SiteMember member = siteMemberRepository.findBySiteAndUser(site, user)
                .orElseThrow(() -> new CustomException("해당 사용자는 멤버가 아닙니다."));
        siteMemberRepository.delete(member);

        return "멤버가 삭제되었습니다.";
    }
} 