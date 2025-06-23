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
import java.util.UUID;
import java.util.Optional;

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

    @Autowired
    private EmailService emailService;

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
        // 초대 대상 존재 여부 확인
        userRepository.findByEmail(inviteeEmail)
                .orElseThrow(() -> new CustomException("해당 이메일로 등록된 사용자가 없습니다."));

        Invitation invitation = new Invitation();
        invitation.setSite(site);
        invitation.setInviter(inviter);
        invitation.setInviteeEmail(inviteeEmail);
        invitation.setRole(MemberRole.PM);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setToken(UUID.randomUUID().toString());

        Invitation saved = invitationRepository.save(invitation);

        emailService.sendInvitationEmail(inviteeEmail, site.getName(), saved.getToken());

        return saved;
    }

    @Transactional
    public Invitation inviteToProject(Long projectId, String inviteeEmail, Long inviterId, MemberRole role) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new CustomException("프로젝트를 찾을 수 없습니다."));
        User inviter = userRepository.findById(inviterId)
            .orElseThrow(() -> new CustomException("초대자를 찾을 수 없습니다."));
        // 프로젝트 멤버 여부 및 역할 확인
        ProjectMember inviterMember = projectMemberRepository.findByProjectAndUser(project, inviter).orElse(null);
        Site site = project.getSite();
        SiteMember inviterSiteMember = siteMemberRepository.findBySiteAndUser(site, inviter).orElse(null);

        boolean isAdmin = inviterSiteMember != null && inviterSiteMember.getRole() == MemberRole.ADMIN;
        boolean isPm = inviterMember != null && inviterMember.getRole() == MemberRole.PM;

        if (!isAdmin && !isPm) {
            throw new CustomException("ADMIN 또는 PM만 초대할 수 있습니다.");
        }

        // 초대 대상 존재 여부 확인 및 이미 프로젝트 멤버인지 확인
        User invitee = userRepository.findByEmail(inviteeEmail)
                .orElseThrow(() -> new CustomException("해당 이메일로 등록된 사용자가 없습니다."));

        // 이미 프로젝트 멤버인 경우
        if (projectMemberRepository.findByProjectAndUser(project, invitee).isPresent()) {
            throw new CustomException("해당 사용자는 이미 프로젝트의 멤버입니다.");
        }

        /*
         * 기존 초대가 있는지 확인한다.
         *  - ACCEPTED : 이미 멤버므로 위 로직에서 걸러졌지만, 안전상 한 번 더 예외 처리
         *  - PENDING  : 중복 초대 방지
         *  - REJECTED : 토큰과 시간만 갱신하여 재발송 허용
         */
        Optional<Invitation> existingOpt = invitationRepository.findByInviteeEmailAndProject(inviteeEmail, project);
        if (existingOpt.isPresent()) {
            Invitation existing = existingOpt.get();

            if (!existing.isRejected() && !existing.isAccepted()) {
                throw new CustomException("이미 초대 메일이 발송되어 대기 중입니다.");
            }

            if (existing.isAccepted()) {
                throw new CustomException("해당 사용자는 이미 프로젝트의 멤버입니다.");
            }

            // REJECTED 상태인 경우 -> 재초대 (토큰 갱신, 상태 초기화)
            existing.setRejected(false);
            existing.setAccepted(false);
            existing.setToken(UUID.randomUUID().toString());
            existing.setCreatedAt(LocalDateTime.now());

            Invitation saved = invitationRepository.save(existing);
            emailService.sendInvitationEmail(inviteeEmail, project.getName(), saved.getToken());
            return saved;
        }

        Invitation invitation = new Invitation();
        invitation.setProject(project);
        invitation.setInviter(inviter);
        invitation.setInviteeEmail(inviteeEmail);
        // 초대할 역할 결정: 사이트 ADMIN이면 무조건 PM, PM이 초대하면 MEMBER
        MemberRole targetRole;
        if (isAdmin) {
            targetRole = MemberRole.PM;
        } else {
            targetRole = MemberRole.MEMBER;
        }
        invitation.setRole(targetRole);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setToken(UUID.randomUUID().toString());

        Invitation saved = invitationRepository.save(invitation);

        // 메일 발송
        emailService.sendInvitationEmail(inviteeEmail, project.getName(), saved.getToken());

        return saved;
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

    @Transactional
    public Invitation acceptInvitationByToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new CustomException("유효하지 않은 초대 토큰입니다."));

        if (invitation.isAccepted()) return invitation; // 이미 수락 처리됨

        User user = userRepository.findByEmail(invitation.getInviteeEmail())
                .orElseThrow(() -> new CustomException("사용자 계정을 찾을 수 없습니다."));

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

        return invitation;
    }

    @Transactional
    public void rejectInvitationByToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new CustomException("유효하지 않은 초대 토큰입니다."));

        if (invitation.isRejected() || invitation.isAccepted()) {
            return; // 이미 처리됨
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