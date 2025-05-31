package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.repository.BoardColumnRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardService {
    private final ProjectRepository projectRepository;
    private final BoardColumnRepository columnRepository;
    private final IssueRepository issueRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SiteMemberRepository siteMemberRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getColumns(Long projectId) {
        try {
            log.info("프로젝트 칼럼 목록 조회: projectId={}", projectId);
            
            // 1. 프로젝트 존재 확인
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

            // 2. 프로젝트의 활성화된 칼럼 목록 조회
            List<BoardColumn> columns = columnRepository.findByProjectAndIsActiveTrueOrderByOrderIndexAsc(project);
            log.debug("조회된 칼럼 수: {}", columns.size());

            // 3. 응답 형식으로 변환
            return columns.stream()
                    .map(column -> {
                        Map<String, Object> columnMap = new HashMap<>();
                        columnMap.put("id", column.getId());
                        columnMap.put("title", column.getTitle());
                        columnMap.put("icon", column.getIcon());
                        columnMap.put("projectId", column.getProject().getId());
                        columnMap.put("order", column.getOrderIndex());
                        return columnMap;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("프로젝트 칼럼 목록 조회 중 오류 발생: projectId={}", projectId, e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, List<Map<String, Object>>> getIssues(Long projectId) {
        try {
            log.info("프로젝트 이슈 목록 조회: projectId={}", projectId);
            
            // 1. 프로젝트 존재 확인
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

            // 2. 프로젝트의 활성화된 칼럼 목록 조회
            List<BoardColumn> columns = columnRepository.findByProjectAndIsActiveTrueOrderByOrderIndexAsc(project);
            log.debug("조회된 칼럼 수: {}", columns.size());

            // 3. 각 칼럼별 이슈 목록 조회
            Map<String, List<Map<String, Object>>> issuesByColumn = new HashMap<>();

            for (BoardColumn column : columns) {
                List<Issue> issues = issueRepository.findByColumnAndIsActiveTrueOrderByOrderIndexAsc(column);
                log.debug("칼럼 {}: 조회된 이슈 수: {}", column.getId(), issues.size());
                
                List<Map<String, Object>> issueList = issues.stream()
                        .map(issue -> {
                            Map<String, Object> issueMap = new HashMap<>();
                            issueMap.put("id", issue.getId());
                            issueMap.put("title", issue.getTitle());
                            issueMap.put("description", issue.getDescription());
                            issueMap.put("status", issue.getStatus().toString());
                            issueMap.put("startDate", issue.getStartDate());
                            issueMap.put("endDate", issue.getEndDate());
                            if (issue.getAssignee() != null) {
                                issueMap.put("assigneeId", issue.getAssignee().getUserId());
                            } else {
                                issueMap.put("assigneeId", null);
                            }
                            if (issue.getReporter() != null) {
                                issueMap.put("reporterId", issue.getReporter().getUserId());
                            } else {
                                issueMap.put("reporterId", null);
                            }
                            issueMap.put("columnId", issue.getColumn().getId());
                            issueMap.put("order", issue.getOrderIndex());
                            return issueMap;
                        })
                        .collect(Collectors.toList());

                issuesByColumn.put(column.getId().toString(), issueList);
            }

            return issuesByColumn;
        } catch (Exception e) {
            log.error("프로젝트 이슈 목록 조회 중 오류 발생: projectId={}", projectId, e);
            throw e;
        }
    }

    @Transactional
    public void initializeDefaultColumns(Project project) {
        try {
            log.info("프로젝트 기본 칼럼 초기화: projectId={}", project.getId());
            
            // 기본 칼럼이 없는 경우에만 생성
            if (columnRepository.findByProjectAndIsActiveTrueOrderByOrderIndexAsc(project).isEmpty()) {
                // To Do 칼럼
                BoardColumn todoColumn = BoardColumn.builder()
                        .title("To Do")
                        .icon("todo-icon")
                        .project(project)
                        .orderIndex(1)
                        .isActive(true)
                        .build();
                columnRepository.save(todoColumn);
                log.debug("To Do 칼럼 생성됨: columnId={}", todoColumn.getId());

                // In Progress 칼럼
                BoardColumn inProgressColumn = BoardColumn.builder()
                        .title("In Progress")
                        .icon("progress-icon")
                        .project(project)
                        .orderIndex(2)
                        .isActive(true)
                        .build();
                columnRepository.save(inProgressColumn);
                log.debug("In Progress 칼럼 생성됨: columnId={}", inProgressColumn.getId());

                // Done 칼럼
                BoardColumn doneColumn = BoardColumn.builder()
                        .title("Done")
                        .icon("done-icon")
                        .project(project)
                        .orderIndex(3)
                        .isActive(true)
                        .build();
                columnRepository.save(doneColumn);
                log.debug("Done 칼럼 생성됨: columnId={}", doneColumn.getId());
            }
        } catch (Exception e) {
            log.error("프로젝트 기본 칼럼 초기화 중 오류 발생: projectId={}", project.getId(), e);
            throw e;
        }
    }

    @Transactional
    public BoardColumn createColumn(Long projectId, String title, String icon, Integer orderIndex, User user) {
        // 1. 프로젝트 존재 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 2. 권한 체크
        // 2-1. 사이트 ADMIN 권한 확인
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
                .orElseThrow(() -> new IllegalArgumentException("사이트 멤버가 아닙니다."));

        boolean hasPermission = false;
        
        // 사이트 ADMIN이면 즉시 권한 부여
        if (siteMember.getRole() == MemberRole.ADMIN) {
            hasPermission = true;
        } else {
            // 2-2. 프로젝트 PM 권한 확인
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트 멤버가 아닙니다."));
            
            // PM인 경우에만 권한 부여
            if (projectMember.getRole() == MemberRole.PM) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            throw new IllegalArgumentException("칼럼을 생성할 권한이 없습니다. 사이트 ADMIN 또는 해당 프로젝트의 PM만 칼럼을 생성할 수 있습니다.");
        }

        // 3. 칼럼 생성
        BoardColumn column = BoardColumn.builder()
                .title(title)
                .icon(icon)
                .project(project)
                .orderIndex(orderIndex)
                .isActive(true)
                .build();

        return columnRepository.save(column);
    }

    @Transactional
    public BoardColumn updateColumn(Long columnId, String title, User user) {
        // 1. 칼럼 존재 확인
        BoardColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new IllegalArgumentException("칼럼을 찾을 수 없습니다."));

        Project project = column.getProject();

        // 2. 권한 체크
        // 2-1. 사이트 ADMIN 권한 확인
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
                .orElseThrow(() -> new IllegalArgumentException("사이트 멤버가 아닙니다."));

        boolean hasPermission = false;
        
        // 사이트 ADMIN이면 즉시 권한 부여
        if (siteMember.getRole() == MemberRole.ADMIN) {
            hasPermission = true;
        } else {
            // 2-2. 프로젝트 PM 권한 확인
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트 멤버가 아닙니다."));
            
            // PM인 경우에만 권한 부여
            if (projectMember.getRole() == MemberRole.PM) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            throw new IllegalArgumentException("칼럼을 수정할 권한이 없습니다. 사이트 ADMIN 또는 해당 프로젝트의 PM만 칼럼을 수정할 수 있습니다.");
        }

        // 3. 칼럼 수정
        column.setTitle(title);
        return columnRepository.save(column);
    }

    @Transactional
    public void deleteColumn(Long columnId, User user) {
        // 1. 칼럼 존재 확인
        BoardColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new IllegalArgumentException("칼럼을 찾을 수 없습니다."));

        Project project = column.getProject();

        // 2. 권한 체크
        // 2-1. 사이트 ADMIN 권한 확인
        SiteMember siteMember = siteMemberRepository.findBySiteAndUser(project.getSite(), user)
                .orElseThrow(() -> new IllegalArgumentException("사이트 멤버가 아닙니다."));

        boolean hasPermission = false;
        
        // 사이트 ADMIN이면 즉시 권한 부여
        if (siteMember.getRole() == MemberRole.ADMIN) {
            hasPermission = true;
        } else {
            // 2-2. 프로젝트 PM 권한 확인
            ProjectMember projectMember = projectMemberRepository.findByProjectAndUser(project, user)
                    .orElseThrow(() -> new IllegalArgumentException("프로젝트 멤버가 아닙니다."));
            
            // PM인 경우에만 권한 부여
            if (projectMember.getRole() == MemberRole.PM) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            throw new IllegalArgumentException("칼럼을 삭제할 권한이 없습니다. 사이트 ADMIN 또는 해당 프로젝트의 PM만 칼럼을 삭제할 수 있습니다.");
        }

        // 3. 칼럼 삭제 (실제로는 비활성화)
        column.setIsActive(false);
        columnRepository.save(column);
    }
} 