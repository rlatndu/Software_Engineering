package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.IssueCreateRequest;
import com.example.softwareengineering.dto.IssueUpdateRequest;
import com.example.softwareengineering.dto.IssueResponse;
import com.example.softwareengineering.dto.AttachmentResponse;
import com.example.softwareengineering.dto.IssueOrderUpdateRequest;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.Attachment;
import com.example.softwareengineering.entity.IssueStatus;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.AttachmentRepository;
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
    private AttachmentRepository attachmentRepository;

    // 이슈 생성 (프로젝트 관리자만)
    public IssueResponse createIssue(IssueCreateRequest request, Long userId) {
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new CustomException("프로젝트 없음"));
        User pm = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자 없음"));
        // TODO: 실제 PM 권한 체크 필요 (ProjectMember에서 PM인지 확인)
        // if (!isProjectManager(project, pm)) throw new CustomException("프로젝트 관리자만 이슈를 생성할 수 있습니다.");
        if (request.getEndDate() == null) {
            throw new CustomException("마감일(종료일)은 필수입니다.");
        }
        if (!List.of("TODO", "IN_PROGRESS", "DONE").contains(request.getStatus())) {
            throw new CustomException("status는 TODO, IN_PROGRESS, DONE만 가능합니다.");
        }
        Issue issue = new Issue();
        issue.setProject(project);
        issue.setTitle(request.getTitle());
        issue.setStatus(IssueStatus.valueOf(request.getStatus()));
        issue.setDescription(request.getDescription());
        issue.setStartDate(request.getStartDate());
        issue.setEndDate(request.getEndDate());
        issue.setCreatedAt(LocalDateTime.now());
        issue.setOrder(request.getOrder());
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            issue.setAssignee(assignee);
        }
        if (request.getReporterId() != null) {
            User reporter = userRepository.findById(request.getReporterId()).orElse(null);
            issue.setReporter(reporter);
        }
        Issue saved = issueRepository.save(issue);
        return toResponse(saved);
    }

    // 프로젝트별 이슈 목록 조회 (권한 체크: 프로젝트 멤버만)
    public List<IssueResponse> getIssuesByProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new CustomException("프로젝트 없음"));
        // TODO: 프로젝트 멤버 권한 체크 필요
        List<Issue> issues = issueRepository.findByProject(project);
        return issues.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // 이슈 수정 (담당자만)
    public IssueResponse updateIssue(Long issueId, IssueUpdateRequest request, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        if (issue.getAssignee() == null || !issue.getAssignee().getId().equals(userId)) {
            throw new CustomException("이슈를 수정할 권한이 없습니다.");
        }
        if (request.getTitle() != null) issue.setTitle(request.getTitle());
        if (request.getDescription() != null) issue.setDescription(request.getDescription());
        if (request.getStatus() != null) issue.setStatus(IssueStatus.valueOf(request.getStatus()));
        if (request.getStartDate() != null) issue.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) issue.setEndDate(request.getEndDate());
        if (request.getOrder() != null) issue.setOrder(request.getOrder());
        // 담당자 변경 시 권한도 이전
        if (request.getAssigneeId() != null && !request.getAssigneeId().equals(issue.getAssignee() != null ? issue.getAssignee().getId() : null)) {
            User newAssignee = userRepository.findById(request.getAssigneeId()).orElseThrow(() -> new CustomException("새 담당자 없음"));
            issue.setAssignee(newAssignee);
        }
        Issue saved = issueRepository.save(issue);
        return toResponse(saved);
    }

    // 이슈 삭제 (담당자만)
    public void deleteIssue(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        if (issue.getAssignee() == null || !issue.getAssignee().getId().equals(userId)) {
            throw new CustomException("이슈를 삭제할 권한이 없습니다.");
        }
        issueRepository.delete(issue);
    }

    // 이슈 우선순위 일괄 변경
    public void updateIssueOrders(java.util.List<IssueOrderUpdateRequest> orderList, Long userId) {
        for (IssueOrderUpdateRequest req : orderList) {
            Issue issue = issueRepository.findById(req.getIssueId())
                .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            // 권한 체크: 프로젝트 멤버만 가능(추후 보완)
            issue.setOrder(req.getOrder());
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
        dto.setAssigneeId(issue.getAssignee() != null ? issue.getAssignee().getId() : null);
        dto.setAssigneeName(issue.getAssignee() != null ? issue.getAssignee().getUserId() : null);
        dto.setReporterId(issue.getReporter() != null ? issue.getReporter().getId() : null);
        dto.setReporterName(issue.getReporter() != null ? issue.getReporter().getUserId() : null);
        dto.setProjectId(issue.getProject() != null ? issue.getProject().getId() : null);
        dto.setProjectName(issue.getProject() != null ? issue.getProject().getName() : null);
        dto.setOrder(issue.getOrder());
        dto.setCreatedAt(issue.getCreatedAt());
        // 첨부파일 리스트 변환
        List<Attachment> attachments = new ArrayList<>(issue.getAttachments());
        java.util.List<AttachmentResponse> attachmentResponses = new java.util.ArrayList<>();
        for (Attachment att : attachments) {
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