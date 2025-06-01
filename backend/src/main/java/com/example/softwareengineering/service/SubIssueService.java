package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.SubIssueRequest;
import com.example.softwareengineering.dto.SubIssueResponse;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.SubIssue;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.SubIssueRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubIssueService {
    @Autowired
    private SubIssueRepository subIssueRepository;
    @Autowired
    private IssueRepository issueRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SiteMemberRepository siteMemberRepository;
    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    private boolean checkPermission(Issue issue, Long userId) {
        // 1. 사이트 ADMIN 권한 체크 (최우선)
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(issue.getProject().getSite(), 
            userRepository.findById(userId).orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.")))
            .orElse(null);
        if (siteMember != null && siteMember.getRole() == MemberRole.ADMIN) {
            return true;
        }
        
        // 2. 프로젝트 ADMIN/PM 권한 체크
        ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(issue.getProject(), 
            userRepository.findById(userId).orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.")))
            .orElse(null);
        if (projectMember != null && 
            (projectMember.getRole() == MemberRole.ADMIN || projectMember.getRole() == MemberRole.PM)) {
            return true;
        }
        
        // 3. 담당자 체크
        return issue.getAssignee() != null && issue.getAssignee().getId().equals(userId);
    }

    // 하위이슈 생성 (이슈 담당자, ADMIN, PM 가능)
    public SubIssueResponse createSubIssue(Long parentIssueId, SubIssueRequest request, Long userId) {
        Issue parent = issueRepository.findById(parentIssueId)
            .orElseThrow(() -> new CustomException("상위 이슈를 찾을 수 없습니다."));
        
        if (!checkPermission(parent, userId)) {
            throw new CustomException("하위이슈를 생성할 권한이 없습니다.");
        }

        SubIssue sub = new SubIssue();
        sub.setParentIssue(parent);
        sub.setName(request.getName());
        sub.setChecked(false);
        sub = subIssueRepository.save(sub);
        return toResponse(sub);
    }

    // 하위이슈 삭제 (이슈 담당자, ADMIN, PM 가능)
    public void deleteSubIssue(Long subIssueId, Long userId) {
        SubIssue sub = subIssueRepository.findById(subIssueId)
            .orElseThrow(() -> new CustomException("하위이슈를 찾을 수 없습니다."));
        Issue parent = sub.getParentIssue();
        
        if (!checkPermission(parent, userId)) {
            throw new CustomException("하위이슈를 삭제할 권한이 없습니다.");
        }

        subIssueRepository.delete(sub);
    }

    // 하위이슈 체크/해제 (이슈 담당자, ADMIN, PM 가능)
    public SubIssueResponse checkSubIssue(Long subIssueId, boolean checked, Long userId) {
        SubIssue sub = subIssueRepository.findById(subIssueId)
            .orElseThrow(() -> new CustomException("하위이슈를 찾을 수 없습니다."));
        Issue parent = sub.getParentIssue();
        
        if (!checkPermission(parent, userId)) {
            throw new CustomException("하위이슈 상태를 변경할 권한이 없습니다.");
        }

        sub.setChecked(checked);
        sub = subIssueRepository.save(sub);
        return toResponse(sub);
    }

    // 하위이슈 목록 조회 (이슈 담당자, ADMIN, PM 가능)
    public List<SubIssueResponse> getSubIssues(Long parentIssueId, Long userId) {
        Issue parent = issueRepository.findById(parentIssueId)
            .orElseThrow(() -> new CustomException("상위 이슈를 찾을 수 없습니다."));
        
        if (!checkPermission(parent, userId)) {
            throw new CustomException("하위이슈를 조회할 권한이 없습니다.");
        }

        List<SubIssue> list = subIssueRepository.findByParentIssue(parent);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private SubIssueResponse toResponse(SubIssue sub) {
        SubIssueResponse dto = new SubIssueResponse();
        dto.setId(sub.getId());
        dto.setName(sub.getName());
        dto.setChecked(sub.isChecked());
        return dto;
    }
} 