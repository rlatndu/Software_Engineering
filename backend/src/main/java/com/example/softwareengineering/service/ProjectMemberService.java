package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.MembershipInviteRequest;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.Site;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProjectMemberService {
    @Autowired
    private ProjectMemberRepository projectMemberRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SiteMemberRepository siteMemberRepository;

    // ADMIN이 프로젝트에 PM 초대
    public String invitePm(MembershipInviteRequest request) {
        Long projectId = request.getProjectId();
        String userId = request.getUserId();
        Long inviterId = request.getInviterId();
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new CustomException("프로젝트 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        User inviter = userRepository.findById(inviterId).orElseThrow(() -> new CustomException("초대자 없음"));
        // ADMIN 권한 체크 (사이트 기준)
        Site site = project.getSite();
        SiteMember inviterSiteMember = siteMemberRepository.findBySiteAndUser(site, inviter).orElse(null);
        if (inviterSiteMember == null || inviterSiteMember.getRole() != MemberRole.ADMIN) {
            return "ADMIN만 PM을 초대할 수 있습니다.";
        }
        if (projectMemberRepository.existsByProjectAndUser(project, user)) {
            return "이미 프로젝트 멤버입니다.";
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(MemberRole.PM);
        projectMemberRepository.save(member);
        return "PM이 초대되었습니다.";
    }

    // PM/ADMIN이 프로젝트에 MEMBER 초대
    public String inviteMember(MembershipInviteRequest request) {
        Long projectId = request.getProjectId();
        String userId = request.getUserId();
        Long inviterId = request.getInviterId();
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new CustomException("프로젝트 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        User inviter = userRepository.findById(inviterId).orElseThrow(() -> new CustomException("초대자 없음"));
        ProjectMember inviterProjectMember = projectMemberRepository.findByProjectAndUser(project, inviter).orElse(null);
        Site site = project.getSite();
        SiteMember inviterSiteMember = siteMemberRepository.findBySiteAndUser(site, inviter).orElse(null);
        boolean isAdmin = inviterSiteMember != null && inviterSiteMember.getRole() == MemberRole.ADMIN;
        boolean isPm = inviterProjectMember != null && inviterProjectMember.getRole() == MemberRole.PM;
        if (!isAdmin && !isPm) {
            return "ADMIN 또는 PM만 멤버를 초대할 수 있습니다.";
        }
        if (projectMemberRepository.existsByProjectAndUser(project, user)) {
            return "이미 프로젝트 멤버입니다.";
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(MemberRole.MEMBER);
        projectMemberRepository.save(member);
        return "멤버가 초대되었습니다.";
    }

    // ADMIN/PM이 프로젝트 멤버 역할 변경 (PM은 MEMBER만 변경 가능)
    public String changeRole(Long projectId, String userId, MemberRole newRole, Long changerId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new CustomException("프로젝트 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        User changer = userRepository.findById(changerId).orElseThrow(() -> new CustomException("변경자 없음"));
        ProjectMember changerMember = projectMemberRepository.findByProjectAndUser(project, changer).orElse(null);
        Site site = project.getSite();
        SiteMember changerSiteMember = siteMemberRepository.findBySiteAndUser(site, changer).orElse(null);
        boolean isAdmin = changerSiteMember != null && changerSiteMember.getRole() == MemberRole.ADMIN;
        boolean isPm = changerMember != null && changerMember.getRole() == MemberRole.PM;
        if (!isAdmin && !isPm) {
            return "ADMIN 또는 PM만 역할을 변경할 수 있습니다.";
        }
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user).orElse(null);
        if (member == null) return "해당 사용자는 프로젝트 멤버가 아닙니다.";
        if (isPm && member.getRole() != MemberRole.MEMBER) {
            return "PM은 MEMBER만 역할을 변경할 수 있습니다.";
        }
        member.setRole(newRole);
        projectMemberRepository.save(member);
        return "역할이 변경되었습니다.";
    }

    // ADMIN/PM이 프로젝트 멤버 삭제 (PM은 MEMBER만 삭제 가능)
    public String removeMember(Long projectId, String userId, Long removerId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new CustomException("프로젝트 없음"));
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        User remover = userRepository.findById(removerId).orElseThrow(() -> new CustomException("삭제자 없음"));
        ProjectMember removerMember = projectMemberRepository.findByProjectAndUser(project, remover).orElse(null);
        Site site = project.getSite();
        SiteMember removerSiteMember = siteMemberRepository.findBySiteAndUser(site, remover).orElse(null);
        boolean isAdmin = removerSiteMember != null && removerSiteMember.getRole() == MemberRole.ADMIN;
        boolean isPm = removerMember != null && removerMember.getRole() == MemberRole.PM;
        if (!isAdmin && !isPm) {
            return "ADMIN 또는 PM만 멤버를 삭제할 수 있습니다.";
        }
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user).orElse(null);
        if (member == null) return "해당 사용자는 프로젝트 멤버가 아닙니다.";
        if (isPm && member.getRole() != MemberRole.MEMBER) {
            return "PM은 MEMBER만 삭제할 수 있습니다.";
        }
        projectMemberRepository.delete(member);
        return "멤버가 삭제되었습니다.";
    }
} 