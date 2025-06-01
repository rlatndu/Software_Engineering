package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.IssueCreateRequest;
import com.example.softwareengineering.dto.IssueUpdateRequest;
import com.example.softwareengineering.dto.IssueResponse;
import com.example.softwareengineering.dto.AttachmentResponse;
import com.example.softwareengineering.dto.IssueOrderUpdateRequest;
import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.BoardColumnRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class IssueService {
    @Autowired
    private IssueRepository issueRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BoardColumnRepository columnRepository;
    @Autowired
    private ProjectMemberRepository projectMemberRepository;
    @Autowired
    private SiteMemberRepository siteMemberRepository;

    // 이슈 생성 (프로젝트 관리자만)
    public IssueResponse createIssue(IssueCreateRequest request) {
        try {
            Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new CustomException("프로젝트 없음"));

            // 권한 체크: ADMIN 또는 PM만 이슈 생성 가능
            User reporter = userRepository.findByUserId(request.getReporterId())
                .orElseThrow(() -> new CustomException("생성자를 찾을 수 없습니다."));
            
            boolean hasPermission = false;
            
            // 1. 먼저 사이트 멤버 권한 확인
            SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), reporter)
                .orElseThrow(() -> new CustomException("사이트 멤버가 아닙니다."));
                
            // 사이트 ADMIN이면 즉시 권한 부여
            if (siteMember.getRole() == MemberRole.ADMIN) {
                hasPermission = true;
            } 
            
            // 2. 사이트 ADMIN이 아닌 경우 프로젝트 멤버 권한 확인
            if (!hasPermission) {
                try {
                    ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, reporter)
                        .orElseThrow(() -> new CustomException("프로젝트 멤버가 아닙니다."));
                    
                    // PM인 경우 권한 부여
                    if (projectMember.getRole() == MemberRole.PM) {
                        hasPermission = true;
                    }
                } catch (Exception e) {
                    // 프로젝트 멤버가 아닌 경우 무시하고 진행 (이미 hasPermission이 false)
                }
            }

            if (!hasPermission) {
                throw new CustomException(String.format(
                    "이슈 생성 권한이 없습니다. (사이트 role: %s)", 
                    siteMember.getRole()
                ));
            }

            if (request.getEndDate() == null) {
                throw new CustomException("마감일(종료일)은 필수입니다.");
            }
            if (!List.of("TODO", "IN_PROGRESS", "DONE").contains(request.getStatus())) {
                throw new CustomException("status는 TODO, IN_PROGRESS, DONE만 가능합니다.");
            }

            // 컬럼 찾기
            if (request.getColumnId() == null) {
                throw new CustomException("컬럼 ID가 필요합니다.");
            }

            BoardColumn column = columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new CustomException("컬럼을 찾을 수 없습니다."));

            // 생성자/보고자 찾기 (reporterId가 없으면 assigneeId 사용)
            String reporterId = request.getReporterId() != null ? request.getReporterId() : request.getAssigneeId();
            if (reporterId == null) {
                throw new CustomException("생성자 정보가 필요합니다. (reporterId 또는 assigneeId)");
            }
            User reporterUser = userRepository.findByUserId(reporterId)
                .orElseThrow(() -> new CustomException("생성자를 찾을 수 없습니다."));

            Issue issue = new Issue();
            issue.setProject(project);
            issue.setTitle(request.getTitle());
            issue.setStatus(IssueStatus.valueOf(request.getStatus()));
            issue.setDescription(request.getDescription());
            issue.setStartDate(request.getStartDate());
            issue.setEndDate(request.getEndDate());
            issue.setCreatedAt(LocalDateTime.now());
            issue.setOrderIndex(request.getOrder());
            issue.setColumn(column);   // 컬럼 설정
            issue.setReporter(reporterUser);  // 보고자 설정
            issue.setCreatedBy(reporterUser); // 생성자 설정

            // 담당자 설정 (있는 경우에만)
            if (request.getAssigneeId() != null) {
                User assignee = userRepository.findByUserId(request.getAssigneeId())
                    .orElseThrow(() -> new CustomException("담당자를 찾을 수 없습니다."));
                issue.setAssignee(assignee);
            }

            Issue savedIssue = issueRepository.save(issue);
            return toResponse(savedIssue);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("이슈 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 프로젝트별 이슈 목록 조회 (모든 사용자 접근 가능)
    public List<IssueResponse> getIssuesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new CustomException("프로젝트 없음"));
        List<Issue> issues = issueRepository.findByProject(project);
        return issues.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // 이슈 수정 (담당자, ADMIN, PM 가능)
    public IssueResponse updateIssue(Long issueId, IssueUpdateRequest request, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
        // 권한 체크
        boolean hasPermission = false;
        
        // 1. 사이트 ADMIN 권한 체크 (최우선)
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(issue.getProject().getSite(), user)
            .orElse(null);
        if (siteMember != null && siteMember.getRole() == MemberRole.ADMIN) {
            hasPermission = true;
        }
        
        // 2. 프로젝트 ADMIN/PM 권한 체크
        if (!hasPermission) {
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(issue.getProject(), user)
                .orElse(null);
            if (projectMember != null && 
                (projectMember.getRole() == MemberRole.ADMIN || projectMember.getRole() == MemberRole.PM)) {
                hasPermission = true;
            }
        }
        
        // 3. 담당자 체크
        if (!hasPermission && issue.getAssignee() != null && issue.getAssignee().getId().equals(userId)) {
            hasPermission = true;
        }
        
        if (!hasPermission) {
            throw new CustomException("이슈를 수정할 권한이 없습니다.");
        }

        if (request.getTitle() != null) issue.setTitle(request.getTitle());
        if (request.getDescription() != null) issue.setDescription(request.getDescription());
        if (request.getStatus() != null) issue.setStatus(IssueStatus.valueOf(request.getStatus()));
        if (request.getStartDate() != null) issue.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) issue.setEndDate(request.getEndDate());
        if (request.getOrder() != null) issue.setOrderIndex(request.getOrder());
        
        // 담당자 변경
        if (request.getAssigneeId() != null && !request.getAssigneeId().equals(issue.getAssignee() != null ? issue.getAssignee().getUserId() : null)) {
            User newAssignee = userRepository.findByUserId(request.getAssigneeId())
                .orElseThrow(() -> new CustomException("새 담당자를 찾을 수 없습니다."));
            issue.setAssignee(newAssignee);
        }
        
        issue.setUpdatedBy(user);
        Issue saved = issueRepository.save(issue);
        return toResponse(saved);
    }

    // 이슈 삭제 (담당자, ADMIN, PM 가능)
    public void deleteIssue(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
        // 권한 체크
        boolean hasPermission = false;
        
        // 1. 사이트 ADMIN 권한 체크 (최우선)
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(issue.getProject().getSite(), user)
            .orElse(null);
        if (siteMember != null && siteMember.getRole() == MemberRole.ADMIN) {
            hasPermission = true;
        }
        
        // 2. 프로젝트 ADMIN/PM 권한 체크
        if (!hasPermission) {
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(issue.getProject(), user)
                .orElse(null);
            if (projectMember != null && 
                (projectMember.getRole() == MemberRole.ADMIN || projectMember.getRole() == MemberRole.PM)) {
                hasPermission = true;
            }
        }
        
        // 3. 담당자 체크
        if (!hasPermission && issue.getAssignee() != null && issue.getAssignee().getId().equals(userId)) {
            hasPermission = true;
        }
        
        if (!hasPermission) {
            throw new CustomException("이슈를 삭제할 권한이 없습니다.");
        }

        issueRepository.delete(issue);
    }

    // 이슈 우선순위 일괄 변경
    public void updateIssueOrders(List<IssueOrderUpdateRequest> orderList, Long userId) {
        for (IssueOrderUpdateRequest req : orderList) {
            Issue issue = issueRepository.findById(req.getIssueId())
                .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            // 권한 체크: 프로젝트 멤버만 가능(추후 보완)
            issue.setOrderIndex(req.getOrder());
            issueRepository.save(issue);
        }
    }

    private IssueResponse toResponse(Issue issue) {
        IssueResponse dto = new IssueResponse();
        dto.setId(issue.getId());
        dto.setTitle(issue.getTitle());
        dto.setStatus(issue.getStatus().toString());
        dto.setDescription(issue.getDescription());
        dto.setStartDate(issue.getStartDate());
        dto.setEndDate(issue.getEndDate());
        dto.setAssigneeId(issue.getAssignee() != null ? issue.getAssignee().getUserId() : null);
        dto.setAssigneeName(issue.getAssignee() != null ? issue.getAssignee().getUserId() : null);
        dto.setReporterId(issue.getReporter() != null ? issue.getReporter().getUserId() : null);
        dto.setReporterName(issue.getReporter() != null ? issue.getReporter().getUserId() : null);
        dto.setProjectId(issue.getProject() != null ? issue.getProject().getId() : null);
        dto.setProjectName(issue.getProject() != null ? issue.getProject().getName() : null);
        dto.setOrder(issue.getOrderIndex());
        dto.setCreatedAt(issue.getCreatedAt());
        // 첨부파일 리스트 변환
        List<IssueAttachment> attachments = new ArrayList<>(issue.getAttachments());
        List<AttachmentResponse> attachmentResponses = new ArrayList<>();
        for (IssueAttachment att : attachments) {
            AttachmentResponse ar = new AttachmentResponse();
            ar.setId(att.getId());
            ar.setFileName(att.getFileName());
            ar.setFileUrl("/api/issues/" + issue.getId() + "/attachments/" + att.getId());
            ar.setUploadedAt(att.getUploadedAt());
            attachmentResponses.add(ar);
        }
        dto.setAttachments(attachmentResponses);
        return dto;
    }
} 