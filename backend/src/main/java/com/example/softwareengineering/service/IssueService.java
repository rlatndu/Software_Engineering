package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.IssueCreateRequest;
import com.example.softwareengineering.dto.IssueUpdateRequest;
import com.example.softwareengineering.dto.IssueResponse;
import com.example.softwareengineering.dto.AttachmentResponse;
import com.example.softwareengineering.dto.IssueOrderUpdateRequest;
import com.example.softwareengineering.dto.ActivityLogRequestDTO;
import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.BoardColumnRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.UserIssueOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Slf4j
@Service
@Transactional(readOnly = true)
public class IssueService {
    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final BoardColumnRepository columnRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SiteMemberRepository siteMemberRepository;
    private final ProjectService projectService;
    private final ActivityLogService activityLogService;
    private final UserIssueOrderRepository userIssueOrderRepository;

    public IssueService(
            IssueRepository issueRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            BoardColumnRepository columnRepository,
            ProjectMemberRepository projectMemberRepository,
            SiteMemberRepository siteMemberRepository,
            ProjectService projectService,
            ActivityLogService activityLogService,
            UserIssueOrderRepository userIssueOrderRepository) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.columnRepository = columnRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.siteMemberRepository = siteMemberRepository;
        this.projectService = projectService;
        this.activityLogService = activityLogService;
        this.userIssueOrderRepository = userIssueOrderRepository;
    }

    // 권한 체크를 위한 새로운 메소드
    private boolean checkPermission(Project project, User user) {
        // 1. 사이트 멤버 권한 확인
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
            .orElse(null);
            
        if (siteMember != null && siteMember.getRole() == MemberRole.ADMIN) {
            return true;
        }
        
        // 2. 프로젝트 멤버 권한 확인
        ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
            .orElse(null);
            
        return projectMember != null && (projectMember.getRole() == MemberRole.PM || projectMember.getRole() == MemberRole.ADMIN);
    }

    // 이슈 생성 (프로젝트 관리자만)
    @Transactional
    public IssueResponse createIssue(IssueCreateRequest request) {
        try {
            System.out.println("Received issue create request: " + request);
            System.out.println("ProjectId: " + request.getProjectId());
            System.out.println("ColumnId: " + request.getColumnId());
            System.out.println("ReporterId: " + request.getReporterId());
            System.out.println("AssigneeId: " + request.getAssigneeId());

            Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new CustomException("프로젝트 없음"));

            User reporter = userRepository.findByUserId(request.getReporterId())
                .orElseThrow(() -> new CustomException("생성자를 찾을 수 없습니다."));
            
            // 권한 체크 최적화
            if (!checkPermission(project, reporter)) {
                throw new CustomException("이슈 생성 권한이 없습니다.");
            }

            if (request.getEndDate() == null) {
                throw new CustomException("마감일(종료일)은 필수입니다.");
            }

            // 상태 문자열 정규화 (공백→'_') & 대문자 변환
            String normalizedStatus = request.getStatus() == null ? "TODO"
                    : request.getStatus().replace(" ", "_").toUpperCase();

            if (!List.of("TODO", "IN_PROGRESS", "DONE", "HOLD").contains(normalizedStatus)) {
                throw new CustomException("status는 TODO, IN_PROGRESS, DONE, HOLD만 가능합니다.");
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
            issue.setStatus(IssueStatus.valueOf(normalizedStatus));
            issue.setDescription(request.getDescription());
            issue.setStartDate(request.getStartDate());
            issue.setEndDate(request.getEndDate());
            issue.setCreatedAt(LocalDateTime.now());
            int orderIdx = request.getOrder() != null ? request.getOrder() : 0;
            issue.setOrderIndex(orderIdx);
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
            
            // 활동 내역 저장
            activityLogService.createActivityLog(ActivityLogRequestDTO.builder()
                .userId(reporterUser.getId())
                .type(ActivityType.ISSUE_CREATE)
                .title(savedIssue.getTitle())
                .projectId(project.getId())
                .issueId(savedIssue.getId())
                .targetPage("/projects/" + project.getId() + "/issues/" + savedIssue.getId())
                .build());
            
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
            
        // 현재 로그인한 사용자 정보 가져오기
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
        // 프로젝트의 모든 이슈 가져오기
        List<Issue> issues = issueRepository.findByProjectAndIsActiveTrue(project);
        
        // 사용자별 순서 정보 가져오기
        List<UserIssueOrder> userOrders = userIssueOrderRepository.findByUserIdAndProjectOrderByOrderIndexAsc(userId, project);
        
        if (userOrders.isEmpty()) {
            // 사용자별 순서가 없는 경우, 생성일자 순으로 정렬하여 새로운 순서 생성
            int order = 0;
            for (Issue issue : issues) {
                UserIssueOrder userOrder = UserIssueOrder.builder()
                    .user(user)
                    .issue(issue)
                    .project(project)
                    .column(issue.getColumn())
                    .orderIndex(order++)
                    .build();
                userIssueOrderRepository.save(userOrder);
            }
            // 새로 생성된 순서 조회
            userOrders = userIssueOrderRepository.findByUserIdAndProjectOrderByOrderIndexAsc(userId, project);
        }
        
        // 사용자별 순서대로 이슈 목록 생성
        final List<UserIssueOrder> finalUserOrders = userOrders;
        issues = finalUserOrders.stream()
            .map(UserIssueOrder::getIssue)
            .collect(Collectors.toList());
            
        return issues.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // 이슈 수정 (담당자, ADMIN, PM 가능)
    @Transactional
    public IssueResponse updateIssue(Long issueId, IssueUpdateRequest request, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
        // 권한 체크 최적화
        boolean hasPermission = checkPermission(issue.getProject(), user);
        
        // 담당자도 수정 가능
        if (!hasPermission && issue.getAssignee() != null && issue.getAssignee().getId().equals(userId)) {
            hasPermission = true;
        }
        
        if (!hasPermission) {
            throw new CustomException("이슈를 수정할 권한이 없습니다.");
        }

        // 상태 변경 전의 상태 저장
        IssueStatus oldStatus = issue.getStatus();
        String oldTitle = issue.getTitle();
        
        // 이슈 정보 업데이트
        if (request.getTitle() != null) {
            issue.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            issue.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            String normalizedStatus = request.getStatus().replace(" ", "_").toUpperCase();
            IssueStatus newStatus = IssueStatus.valueOf(normalizedStatus);
            if (oldStatus != newStatus) {  // 상태가 실제로 변경되었는지 확인
                issue.setStatus(newStatus);
                
                // 상태에 맞는 칼럼 찾기
                List<BoardColumn> columns = columnRepository.findByProjectAndIsActiveTrueOrderByOrderIndexAsc(issue.getProject());
                BoardColumn targetColumn = null;
                
                // 상태 이름과 칼럼 이름 매칭
                String statusName = normalizedStatus;
                if (statusName.equals("TODO")) {
                    statusName = "To Do";
                } else if (statusName.equals("IN_PROGRESS")) {
                    statusName = "In Progress";
                } else if (statusName.equals("DONE")) {
                    statusName = "Done";
                } else if (statusName.equals("HOLD")) {
                    statusName = "Hold";
                }
                
                for (BoardColumn col : columns) {
                    if (col.getTitle().equals(statusName)) {
                        targetColumn = col;
                        break;
                    }
                }
                
                if (targetColumn == null) {
                    throw new CustomException("상태에 해당하는 칼럼을 찾을 수 없습니다: " + statusName);
                }
                
                // 이전 칼럼 저장
                BoardColumn oldColumn = issue.getColumn();
                
                // 칼럼 변경
                issue.setColumn(targetColumn);
                
                // 이전 칼럼에서 해당 이슈의 순서 정보 삭제
                List<UserIssueOrder> oldOrders = userIssueOrderRepository.findByIssueAndColumn(issue, oldColumn);
                userIssueOrderRepository.deleteAll(oldOrders);
                
                // 새로운 칼럼에 모든 사용자의 이슈 순서 정보 추가
                List<ProjectMember> projectMembers = projectMemberRepository.findByProject(issue.getProject());
                for (ProjectMember member : projectMembers) {
                    // 해당 사용자의 새 칼럼에서의 마지막 순서 찾기
                    List<UserIssueOrder> userOrders = userIssueOrderRepository.findByUserIdAndColumnOrderByOrderIndexDesc(
                        member.getUser().getUserId(), 
                        targetColumn
                    );
                    int newOrderIndex = userOrders.isEmpty() ? 0 : userOrders.get(0).getOrderIndex() + 1;
                    
                    // 새로운 순서 정보 생성
                    UserIssueOrder newOrder = UserIssueOrder.builder()
                        .user(member.getUser())
                        .issue(issue)
                        .project(issue.getProject())
                        .column(targetColumn)
                        .orderIndex(newOrderIndex)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                    userIssueOrderRepository.save(newOrder);
                }
                
                // 활동 내역 저장
                activityLogService.createActivityLog(ActivityLogRequestDTO.builder()
                    .userId(userId)
                    .type(ActivityType.ISSUE_STATUS_CHANGE)
                    .title(issue.getTitle())
                    .content(String.format("상태 변경: %s → %s, 칼럼 변경: %s → %s", 
                        oldStatus, newStatus, 
                        oldColumn.getTitle(), targetColumn.getTitle()))
                    .projectId(issue.getProject().getId())
                    .issueId(issue.getId())
                    .statusChange(oldStatus + " -> " + newStatus)
                    .targetPage("/projects/" + issue.getProject().getId() + "/issues/" + issue.getId())
                    .build());
            }
        }
        if (request.getStartDate() != null) {
            issue.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            issue.setEndDate(request.getEndDate());
        }
        if (request.getOrder() != null) {
            issue.setOrderIndex(request.getOrder());
        }
        
        // 제목이 변경된 경우
        if (request.getTitle() != null && !oldTitle.equals(issue.getTitle())) {
            activityLogService.createActivityLog(ActivityLogRequestDTO.builder()
                .userId(userId)
                .type(ActivityType.ISSUE_UPDATE)
                .title(issue.getTitle())
                .content(oldTitle + " -> " + issue.getTitle())
                .projectId(issue.getProject().getId())
                .issueId(issue.getId())
                .targetPage("/projects/" + issue.getProject().getId() + "/issues/" + issue.getId())
                .build());
        }

        // 담당자 변경 (빈 문자열이면 변경 없음으로 간주)
        if (request.getAssigneeId() != null && !request.getAssigneeId().isBlank() && !request.getAssigneeId().equals(issue.getAssignee() != null ? issue.getAssignee().getUserId() : null)) {
            User newAssignee = userRepository.findByUserId(request.getAssigneeId())
                .orElseThrow(() -> new CustomException("새 담당자를 찾을 수 없습니다."));
            issue.setAssignee(newAssignee);
        }
        
        issue.setUpdatedBy(user);
        Issue saved = issueRepository.save(issue);

        return toResponse(saved);
    }

    // 이슈 삭제 (담당자, ADMIN, PM 가능)
    @Transactional
    public void deleteIssue(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
            
        // 권한 체크 최적화
        boolean hasPermission = checkPermission(issue.getProject(), user);
        
        // 담당자도 삭제 가능
        if (!hasPermission && issue.getAssignee() != null && issue.getAssignee().getId().equals(userId)) {
            hasPermission = true;
        }

        if (!hasPermission) {
            throw new CustomException("이슈를 삭제할 권한이 없습니다.");
        }

        // 연관된 댓글과 첨부파일 삭제
        issue.getComments().clear();
        issue.getAttachments().clear();

        issueRepository.delete(issue);
    }

    // 이슈 우선순위 일괄 변경
    @Transactional
    public void updateIssueOrders(List<IssueOrderUpdateRequest> orderList, Long userId) {
        if (orderList == null || orderList.isEmpty()) {
            throw new CustomException("업데이트할 이슈 목록이 비어있습니다.");
        }

        // 첫 번째 이슈로 프로젝트 정보 가져오기
        Issue firstIssue = issueRepository.findById(orderList.get(0).getIssueId())
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        Project project = firstIssue.getProject();

        // 사용자 찾기
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        // 프로젝트 멤버인지 확인
        ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
            .orElseThrow(() -> new CustomException("프로젝트 멤버가 아닙니다."));

        // 모든 이슈가 같은 칼럼에 속하는지 확인
        BoardColumn firstColumn = firstIssue.getColumn();
        boolean isSameColumn = true;
        
        for (IssueOrderUpdateRequest req : orderList) {
            Issue issue = issueRepository.findById(req.getIssueId())
                .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
            // 같은 프로젝트 체크
            if (!issue.getProject().getId().equals(project.getId())) {
                throw new CustomException("서로 다른 프로젝트의 이슈는 함께 순서를 변경할 수 없습니다.");
            }

            // 같은 칼럼인지 체크
            if (!issue.getColumn().getId().equals(firstColumn.getId())) {
                isSameColumn = false;
            }

            // order_index 값이 음수인 경우 예외 처리
            if (req.getOrder() < 0) {
                throw new CustomException("순서 값은 0 이상이어야 합니다.");
            }
        }

        // 다른 칼럼으로 이동하는 경우 추가 권한 체크
        if (!isSameColumn) {
            boolean hasPermission = false;

            // 1. 사이트 ADMIN 권한 체크
            SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
                .orElseThrow(() -> new CustomException("사이트 멤버가 아닙니다."));
            if (siteMember.getRole() == MemberRole.ADMIN) {
                hasPermission = true;
            }

            // 2. 프로젝트 PM 또는 ADMIN 권한 체크
            if (!hasPermission && (projectMember.getRole() == MemberRole.PM || projectMember.getRole() == MemberRole.ADMIN)) {
                hasPermission = true;
            }

            // 3. 이슈 담당자 체크
            if (!hasPermission) {
                for (IssueOrderUpdateRequest req : orderList) {
                    Issue issue = issueRepository.findById(req.getIssueId())
                        .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
                    if (issue.getAssignee() != null && issue.getAssignee().getId().equals(userId)) {
                        hasPermission = true;
                        break;
                    }
                }
            }

            if (!hasPermission) {
                throw new CustomException("이슈를 다른 칼럼으로 이동할 권한이 없습니다.");
            }
        }

        // 이슈 순서 업데이트
        for (IssueOrderUpdateRequest req : orderList) {
            Issue issue = issueRepository.findById(req.getIssueId())
                .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
            try {
                // 사용자별 순서만 업데이트 (userId로 조회)
                UserIssueOrder userOrder = userIssueOrderRepository.findByUserIdAndIssueAndColumn(user.getUserId(), issue, issue.getColumn())
                        .orElse(new UserIssueOrder());

                // 새로운 UserIssueOrder인 경우
                if (userOrder.getId() == null) {
                    userOrder.setUser(user);
                    userOrder.setIssue(issue);
                    userOrder.setProject(project);
                    userOrder.setColumn(issue.getColumn());
                    userOrder.setCreatedAt(LocalDateTime.now());
                }
            
                userOrder.setOrderIndex(req.getOrder());
                userOrder.setUpdatedAt(LocalDateTime.now());
                
                userIssueOrderRepository.save(userOrder);
            } catch (Exception e) {
                log.error("이슈 순서 업데이트 중 오류 발생: {}", e.getMessage(), e);
                throw new CustomException("이슈 순서 업데이트에 실패했습니다: " + e.getMessage());
            }
        }
    }

    // 이슈 목록 조회 시 사용자별 순서 적용
    public List<Issue> getIssuesByColumn(Long columnId, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
        BoardColumn column = columnRepository.findById(columnId)
            .orElseThrow(() -> new CustomException("칼럼을 찾을 수 없습니다."));

        // 사용자별 순서 정보 조회 (userId로 조회)
        List<UserIssueOrder> userOrders = userIssueOrderRepository.findByUserIdAndColumnOrderByOrderIndexAsc(user.getUserId(), column);
        
        if (userOrders.isEmpty()) {
            // 사용자별 순서가 없는 경우, 생성일자 순으로 정렬하여 새로운 순서 생성
            List<Issue> issues = issueRepository.findByColumnAndIsActiveTrueOrderByCreatedAtAsc(column);
            int order = 0;
            for (Issue issue : issues) {
                UserIssueOrder userOrder = new UserIssueOrder();
                userOrder.setUser(user);
                userOrder.setIssue(issue);
                userOrder.setProject(issue.getProject());
                userOrder.setColumn(column);
                userOrder.setOrderIndex(order++);
                userOrder.setCreatedAt(LocalDateTime.now());
                userOrder.setUpdatedAt(LocalDateTime.now());
                userIssueOrderRepository.save(userOrder);
            }
            // 새로 생성된 순서 조회
            userOrders = userIssueOrderRepository.findByUserIdAndColumnOrderByOrderIndexAsc(user.getUserId(), column);
        }

        // 사용자별 순서 반환
        return userOrders.stream()
            .map(UserIssueOrder::getIssue)
            .collect(Collectors.toList());
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