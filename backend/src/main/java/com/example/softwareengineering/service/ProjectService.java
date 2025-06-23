package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.*;
import com.example.softwareengineering.repository.*;
import com.example.softwareengineering.dto.ProjectDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SiteMemberRepository siteMemberRepository;
    private final BoardService boardService;
    private final IssueRepository issueRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final RecentProjectVisitRepository recentProjectVisitRepository;
    private final RecentWorkRepository recentWorkRepository;
    private final ActivityLogRepository activityLogRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final UserIssueOrderRepository userIssueOrderRepository;
    private final IssueCommentRepository issueCommentRepository;
    private final IssueFileRepository issueFileRepository;
    private final InvitationRepository invitationRepository;

    @Transactional
    public ProjectDTO createProject(Long siteId, String name, String key, boolean isPrivate, Long creatorId, String creatorRole) {
        try {
            // 1. 사이트 존재 확인
            Site site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));

            // 2. 생성자 확인
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 3. 프로젝트 이름 길이 검증
            if (name.length() > 30) {
                throw new IllegalArgumentException("프로젝트 이름은 30자를 초과할 수 없습니다.");
            }

            // 4. 프로젝트 키 형식 검증 (3~10자, 영문대문자/숫자)
            if (!key.matches("^[A-Z0-9]{3,10}$")) {
                throw new IllegalArgumentException("프로젝트 키는 3~10자의 영문대문자와 숫자만 사용 가능합니다.");
            }

            // 5. 프로젝트 키 중복 검증
            if (projectRepository.existsByKey(key)) {
                throw new IllegalArgumentException("이미 사용 중인 프로젝트 키입니다.");
            }

            // 6. 프로젝트 생성
            Project project = Project.builder()
                    .name(name)
                    .key(key)
                    .site(site)
                    .isPrivate(isPrivate)
                    .createdAt(LocalDateTime.now())
                    .createdBy(creator)
                    .build();
            
            project = projectRepository.save(project);

            // 7. 생성자의 사이트 권한 확인 및 프로젝트 멤버로 등록
            SiteMember siteMember = siteMemberRepository.findBySiteAndUser(site, creator)
                    .orElseThrow(() -> new IllegalArgumentException("사이트 멤버가 아닙니다."));

            // 8. 프로젝트 멤버 역할 설정
            MemberRole projectRole;
            // 사이트 ADMIN은 무조건 프로젝트 ADMIN 권한 부여
            if (siteMember.getRole() == MemberRole.ADMIN) {
                projectRole = MemberRole.ADMIN;
            } else if ("PM".equals(creatorRole)) {
                // PM인 경우 프로젝트 PM 권한 부여
                if (siteMember.getRole() != MemberRole.PM && siteMember.getRole() != MemberRole.ADMIN) {
                    throw new IllegalArgumentException("프로젝트 PM 권한을 부여할 수 없습니다. 사이트 PM 또는 ADMIN만 PM 권한으로 프로젝트를 생성할 수 있습니다.");
                }
                projectRole = MemberRole.PM;
            } else {
                projectRole = MemberRole.MEMBER;
            }
            
            ProjectMember creatorMember = ProjectMember.builder()
                    .project(project)
                    .user(creator)
                    .role(projectRole)
                    .build();
            
            projectMemberRepository.save(creatorMember);

            // 9. 사이트의 모든 ADMIN을 프로젝트 ADMIN으로 자동 등록
            List<SiteMember> siteAdmins = siteMemberRepository.findBySiteAndRole(site, MemberRole.ADMIN);
            for (SiteMember admin : siteAdmins) {
                // 생성자가 ADMIN인 경우 이미 등록되어 있으므로 건너뜀
                if (admin.getUser().getId().equals(creator.getId())) {
                    continue;
                }
                
                ProjectMember adminMember = ProjectMember.builder()
                        .project(project)
                        .user(admin.getUser())
                        .role(MemberRole.ADMIN)
                        .build();
                
                projectMemberRepository.save(adminMember);
            }

            // 10. 기본 칼럼 생성
            boardService.initializeDefaultColumns(project);

            // 11. DTO로 변환하여 반환
            return ProjectDTO.from(project);
        } catch (Exception e) {
            throw new RuntimeException("프로젝트 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        log.info("프로젝트 {} 삭제 시작", projectId);

        // 1. 프로젝트 존재 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 2. 사용자 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3. 삭제 권한 확인
        checkDeletePermission(project, user);

        try {
            // 4. 활동 로그 삭제
            log.debug("활동 로그 삭제 시작");
            activityLogRepository.deleteByProjectId(projectId);

            // 5. 최근 방문 기록 삭제
            log.debug("최근 방문 기록 삭제 시작");
            recentProjectVisitRepository.deleteByProjectId(projectId);
            recentWorkRepository.deleteByProjectId(projectId);

            // 6. 알림 삭제
            log.debug("알림 삭제 시작");
            notificationRepository.deleteByProjectId(projectId);

            // 6-1. 초대 데이터 삭제
            log.debug("초대 데이터 삭제 시작");
            invitationRepository.deleteByProject(project);

            // 7. 이슈 관련 데이터 삭제
            log.debug("이슈 관련 데이터 삭제 시작");
            // 7-1. 이슈 순서 삭제
            userIssueOrderRepository.deleteByProjectId(projectId);
            // 7-2. 이슈 댓글 삭제
            issueCommentRepository.deleteByProjectId(projectId);
            // 7-3. 이슈 첨부파일 삭제
            issueFileRepository.deleteByProjectId(projectId);
            // 7-4. 이슈 삭제
            issueRepository.deleteByProject(project);

            // 8. 보드 컬럼 삭제
            log.debug("보드 컬럼 삭제 시작");
            boardColumnRepository.deleteByProject(project);

            // 9. 프로젝트 멤버 삭제
            log.debug("프로젝트 멤버 삭제 시작");
            projectMemberRepository.deleteByProject(project);

            // 10. 프로젝트 삭제
            log.debug("프로젝트 삭제 시작");
            projectRepository.delete(project);

            log.info("프로젝트 {} 삭제 완료", projectId);
        } catch (Exception e) {
            log.error("프로젝트 {} 삭제 중 오류 발생: {}", projectId, e.getMessage());
            throw new RuntimeException("프로젝트 삭제 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    private void checkDeletePermission(Project project, User user) {
        boolean hasDeletePermission = false;
        
        // 1. 사이트 ADMIN 권한 확인
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
                .orElseThrow(() -> new IllegalArgumentException("사이트 멤버가 아닙니다."));

        if (siteMember.getRole() == MemberRole.ADMIN) {
            hasDeletePermission = true;
        } else {
            // 2. 프로젝트 ADMIN/PM 권한 확인
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트 멤버가 아닙니다."));
            
            if (projectMember.getRole() == MemberRole.ADMIN || projectMember.getRole() == MemberRole.PM) {
                hasDeletePermission = true;
            }
        }

        if (!hasDeletePermission) {
            throw new IllegalArgumentException("프로젝트 삭제 권한이 없습니다.");
        }
    }

    public List<ProjectDTO> getProjectsBySite(Long siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
        
        List<Project> projects = projectRepository.findBySite(site);
        return projects.stream()
                .map(ProjectDTO::from)
                .collect(Collectors.toList());
    }

    public Project getProjectByKey(String key) {
        return projectRepository.findByKey(key)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
    }

    public List<ProjectDTO> getRecentProjects(Long siteId, Long userId, boolean onlyMine) {
        // 1. 사이트 존재 확인
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
        
        // 2. 최근 프로젝트 조회
        List<Project> recentProjects;
        if (onlyMine) {
            recentProjects = recentProjectVisitRepository.findRecentProjectsBySiteIdAndUserId(siteId, userId);
        } else {
            recentProjects = recentProjectVisitRepository.findRecentProjectsBySiteId(siteId);
        }
        
        return recentProjects.stream()
                .map(ProjectDTO::from)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRecentWorks(Long siteId, Long userId) {
        // 1. 사이트 존재 확인
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));
        
        // 2. 최근 작업 조회 - 현재 로그인한 사용자의 작업만 조회
        List<RecentWork> recentWorks = recentWorkRepository.findByUserAndSite(userId, siteId);
        
        // 3. 응답 데이터 변환
        return recentWorks.stream()
                .map(work -> {
                    Map<String, Object> workMap = new HashMap<>();
                    workMap.put("id", work.getId());
                    workMap.put("description", work.getFormattedDescription());
                    workMap.put("projectName", work.getProject().getName());
                    workMap.put("updatedAt", work.getCreatedAt().format(
                        java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm")
                    ));
                    return workMap;
                })
                .collect(Collectors.toList());
    }

    // 프로젝트 방문 기록 저장
    @Transactional
    public void recordProjectVisit(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        RecentProjectVisit visit = RecentProjectVisit.builder()
                .project(project)
                .user(user)
                .build();

        recentProjectVisitRepository.save(visit);
    }

    // 작업 기록 저장
    @Transactional
    public void recordWork(Long projectId, Long userId, Long issueId, RecentWork.ActionType actionType) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .issue(issue)
                .actionType(actionType)
                .build();

        recentWorkRepository.save(work);
    }

    // 페이지 이동 기록
    @Transactional
    public void recordPageMove(Long projectId, Long userId, String pageName) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // RecentWork 생성
        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .actionType(RecentWork.ActionType.PAGE_MOVE)
                .activityType(RecentWork.ActivityType.PAGE_NAVIGATION)
                .pageName(pageName)
                .build();

        recentWorkRepository.save(work);

        // ActivityLog 생성
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setProject(project);
        activityLog.setType(ActivityType.PAGE_NAVIGATION);
        activityLog.setTitle("페이지 이동");
        activityLog.setTargetPage(pageName);

        activityLogRepository.save(activityLog);
    }

    // 이슈 활동 기록
    @Transactional
    public void recordIssueActivity(Long projectId, Long userId, Long issueId, 
                                  RecentWork.ActionType actionType, 
                                  String previousStatus, String newStatus) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        // RecentWork 생성
        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .issue(issue)
                .actionType(actionType)
                .activityType(RecentWork.ActivityType.ISSUE)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .build();

        recentWorkRepository.save(work);

        // ActivityLog 생성
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setProject(project);
        activityLog.setType(ActivityType.ISSUE_STATUS_CHANGE);
        activityLog.setTitle(String.format("[%s] %s", newStatus, issue.getTitle()));
        activityLog.setContent(String.format("이슈 상태가 '%s'에서 '%s'로 변경되었습니다.", previousStatus, newStatus));
        activityLog.setIssueId(issueId);
        activityLog.setStatusChange(String.format("%s -> %s", previousStatus, newStatus));

        activityLogRepository.save(activityLog);
    }

    // 댓글 활동 기록
    @Transactional
    public void recordCommentActivity(Long projectId, Long userId, String content, 
                                    RecentWork.ActionType actionType) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .actionType(actionType)
                .activityType(RecentWork.ActivityType.COMMENT)
                .content(content)
                .build();

        recentWorkRepository.save(work);
    }

    // 만료된 활동 내역 삭제
    @Transactional
    public void deleteExpiredRecords() {
        recentWorkRepository.deleteExpiredRecords(LocalDateTime.now());
    }

    public List<Map<String, Object>> getUnresolvedIssues(Long siteId, Long userId) {
        // 1. 사이트 존재 확인
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("사이트를 찾을 수 없습니다."));

        // 2. 사용자 존재 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 3. 해당 사이트에서 현재 사용자가 담당자인 미해결 이슈 조회
        List<Issue> issues = issueRepository.findUnresolvedIssuesBySiteAndAssignee(siteId, userId);
        List<Map<String, Object>> unresolvedIssues = new ArrayList<>();
        
        for (Issue issue : issues) {
            Map<String, Object> issueMap = new HashMap<>();
            issueMap.put("id", issue.getId());
            issueMap.put("title", issue.getTitle());
            issueMap.put("projectName", issue.getProject().getName());
            issueMap.put("status", issue.getStatus().toString());
            issueMap.put("dueDate", issue.getDueDate() != null ? 
                issue.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd")) : 
                null);
            unresolvedIssues.add(issueMap);
        }
        
        return unresolvedIssues;
    }

    // 이슈 수정 활동 기록
    @Transactional
    public void recordIssueUpdateActivity(Long projectId, Long userId, Long issueId, String title) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        // RecentWork 생성
        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .issue(issue)
                .actionType(RecentWork.ActionType.UPDATE)
                .activityType(RecentWork.ActivityType.ISSUE)
                .build();

        recentWorkRepository.save(work);

        // ActivityLog 생성
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setProject(project);
        activityLog.setType(ActivityType.ISSUE_UPDATE);
        activityLog.setTitle(title);
        activityLog.setContent("이슈가 수정되었습니다.");
        activityLog.setIssueId(issueId);

        activityLogRepository.save(activityLog);
    }

    // 댓글 작성 활동 기록
    @Transactional
    public void recordCommentCreateActivity(Long projectId, Long userId, Long commentId, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // RecentWork 생성
        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .actionType(RecentWork.ActionType.CREATE)
                .activityType(RecentWork.ActivityType.COMMENT)
                .content(content)
                .build();

        recentWorkRepository.save(work);

        // ActivityLog 생성
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setProject(project);
        activityLog.setType(ActivityType.COMMENT_CREATE);
        activityLog.setTitle("새 댓글");
        activityLog.setContent(content);
        activityLog.setCommentId(commentId);

        activityLogRepository.save(activityLog);
    }

    // 댓글 수정 활동 기록
    @Transactional
    public void recordCommentUpdateActivity(Long projectId, Long userId, Long commentId, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // RecentWork 생성
        RecentWork work = RecentWork.builder()
                .project(project)
                .user(user)
                .actionType(RecentWork.ActionType.UPDATE)
                .activityType(RecentWork.ActivityType.COMMENT)
                .content(content)
                .build();

        recentWorkRepository.save(work);

        // ActivityLog 생성
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(user);
        activityLog.setProject(project);
        activityLog.setType(ActivityType.COMMENT_UPDATE);
        activityLog.setTitle("댓글 수정");
        activityLog.setContent(content);
        activityLog.setCommentId(commentId);

        activityLogRepository.save(activityLog);
    }
} 