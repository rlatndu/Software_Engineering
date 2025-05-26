package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.InvitationResponse;
import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvitationService {

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SiteMemberRepository siteMemberRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Transactional
    public Invitation inviteToSite(Long siteId, String inviteeEmail, Long inviterId) {
        Site site = siteRepository.findById(siteId)
            .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        User inviter = userRepository.findById(inviterId)
            .orElseThrow(() -> new CustomException("초대자를 찾을 수 없습니다."));
        SiteMember inviterMember = siteMemberRepository.findBySiteAndUser(site, inviter)
            .orElseThrow(() -> new CustomException("초대자가 사이트 멤버가 아닙니다."));
        if (inviterMember.getRole() != MemberRole.ADMIN) {
            throw new CustomException("사이트 관리자만 초대할 수 있습니다.");
        }
        Invitation invitation = new Invitation();
        invitation.setSite(site);
        invitation.setInviter(inviter);
        invitation.setInviteeEmail(inviteeEmail);
        invitation.setRole(MemberRole.PM);
        invitation.setCreatedAt(LocalDateTime.now());
        return invitationRepository.save(invitation);
    }

    @Transactional
    public Invitation inviteToProject(Long projectId, String inviteeEmail, Long inviterId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new CustomException("프로젝트를 찾을 수 없습니다."));
        User inviter = userRepository.findById(inviterId)
            .orElseThrow(() -> new CustomException("초대자를 찾을 수 없습니다."));
        ProjectMember inviterMember = projectMemberRepository.findByProjectAndUser(project, inviter)
            .orElseThrow(() -> new CustomException("초대자가 프로젝트 멤버가 아닙니다."));
        if (inviterMember.getRole() != MemberRole.PM) {
            throw new CustomException("프로젝트 관리자만 초대할 수 있습니다.");
        }
        if (invitationRepository.existsByInviteeEmailAndProject(inviteeEmail, project)) {
            throw new CustomException("이미 초대된 사용자입니다.");
        }
        Invitation invitation = new Invitation();
        invitation.setProject(project);
        invitation.setInviter(inviter);
        invitation.setInviteeEmail(inviteeEmail);
        invitation.setRole(MemberRole.MEMBER);
        invitation.setCreatedAt(LocalDateTime.now());
        return invitationRepository.save(invitation);
    }

    @Transactional
    public void acceptInvitation(Long invitationId, Long userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new CustomException("초대를 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
        if (!user.getEmail().equals(invitation.getInviteeEmail())) {
            throw new CustomException("초대된 사용자가 아닙니다.");
        }
        invitation.setAccepted(true);
        if (invitation.getSite() != null) {
            SiteMember siteMember = new SiteMember();
            siteMember.setSite(invitation.getSite());
            siteMember.setUser(user);
            siteMember.setRole(invitation.getRole());
            siteMemberRepository.save(siteMember);
        }
        if (invitation.getProject() != null) {
            ProjectMember projectMember = new ProjectMember();
            projectMember.setProject(invitation.getProject());
            projectMember.setUser(user);
            projectMember.setRole(invitation.getRole());
            projectMemberRepository.save(projectMember);
        }
    }

    @Transactional
    public void rejectInvitation(Long invitationId, Long userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new CustomException("초대를 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
        if (!user.getEmail().equals(invitation.getInviteeEmail())) {
            throw new CustomException("초대된 사용자가 아닙니다.");
        }
        invitation.setRejected(true);
    }

    public List<InvitationResponse> getSiteInvitations(Long siteId) {
        Site site = siteRepository.findById(siteId)
            .orElseThrow(() -> new CustomException("사이트를 찾을 수 없습니다."));
        List<Invitation> invitations = invitationRepository.findBySite(site);
        return invitations.stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<InvitationResponse> getProjectInvitations(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new CustomException("프로젝트를 찾을 수 없습니다."));
        List<Invitation> invitations = invitationRepository.findByProject(project);
        return invitations.stream().map(this::toDto).collect(Collectors.toList());
    }

    private InvitationResponse toDto(Invitation invitation) {
        InvitationResponse dto = new InvitationResponse();
        dto.setId(invitation.getId());
        dto.setSiteName(invitation.getSite() != null ? invitation.getSite().getName() : null);
        dto.setProjectName(invitation.getProject() != null ? invitation.getProject().getName() : null);
        dto.setInviterName(invitation.getInviter() != null ? invitation.getInviter().getUserId() : null);
        dto.setInviteeEmail(invitation.getInviteeEmail());
        dto.setRole(invitation.getRole() != null ? invitation.getRole().name() : null);
        dto.setStatus(invitation.isAccepted() ? "ACCEPTED" : invitation.isRejected() ? "REJECTED" : "PENDING");
        dto.setCreatedAt(invitation.getCreatedAt());
        return dto;
    }
} 