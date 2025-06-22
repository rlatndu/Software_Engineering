package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.ProjectMember;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.entity.UserIssueOrder;
import com.example.softwareengineering.repository.BoardColumnRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.ProjectMemberRepository;
import com.example.softwareengineering.repository.ProjectRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.UserIssueOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final UserRepository userRepository;
    private final UserIssueOrderRepository userIssueOrderRepository;

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

    @Transactional
    public Map<String, List<Map<String, Object>>> getIssues(Long projectId) {
        try {
            log.info("프로젝트 이슈 목록 조회: projectId={}", projectId);
            
            // 현재 로그인한 사용자 정보 가져오기
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByUserId(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            // 1. 프로젝트 존재 확인 및 컬럼 조회를 한 번에 수행
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

            // 2. 프로젝트의 모든 활성화된 컬럼과 이슈를 한 번에 조회
            List<BoardColumn> columns = columnRepository.findByProjectAndIsActiveTrueOrderByOrderIndexAsc(project);
            List<Issue> allIssues = issueRepository.findByProjectAndIsActiveTrue(project);
            
            // 3. 사용자의 모든 이슈 순서 정보를 한 번에 조회
            List<UserIssueOrder> allUserOrders = userIssueOrderRepository.findByUserIdAndProjectOrderByOrderIndexAsc(user.getUserId(), project);
            
            // 4. 컬럼별로 이슈 매핑
            Map<String, List<Map<String, Object>>> issuesByColumn = new HashMap<>();
            Map<Long, List<Issue>> issuesByColumnId = allIssues.stream()
                .collect(Collectors.groupingBy(issue -> issue.getColumn().getId()));
                
            for (BoardColumn column : columns) {
                List<Issue> columnIssues = issuesByColumnId.getOrDefault(column.getId(), new ArrayList<>());
                List<Map<String, Object>> issueList = new ArrayList<>();
                
                // 해당 컬럼의 사용자 순서 정보 필터링
                Map<Long, Integer> issueOrders = allUserOrders.stream()
                    .filter(uo -> uo.getColumn().getId().equals(column.getId()))
                    .collect(Collectors.toMap(
                        uo -> uo.getIssue().getId(),
                        UserIssueOrder::getOrderIndex
                    ));
                    
                // 순서 정보가 없는 경우 새로 생성
                if (issueOrders.isEmpty() && !columnIssues.isEmpty()) {
                    int order = 0;
                    List<UserIssueOrder> newOrders = new ArrayList<>();
                    
                    for (Issue issue : columnIssues) {
                        UserIssueOrder userOrder = UserIssueOrder.builder()
                            .user(user)
                            .issue(issue)
                            .project(project)
                            .column(column)
                            .orderIndex(order++)
                            .build();
                        newOrders.add(userOrder);
                        issueOrders.put(issue.getId(), userOrder.getOrderIndex());
                    }
                    
                    userIssueOrderRepository.saveAll(newOrders);
                }
                
                // 이슈 정보 변환
                for (Issue issue : columnIssues) {
                    Map<String, Object> issueMap = new HashMap<>();
                    issueMap.put("id", issue.getId());
                    issueMap.put("title", issue.getTitle());
                    issueMap.put("description", issue.getDescription());
                    issueMap.put("status", issue.getStatus().toString());
                    issueMap.put("startDate", issue.getStartDate());
                    issueMap.put("endDate", issue.getEndDate());
                    issueMap.put("assigneeId", issue.getAssignee() != null ? issue.getAssignee().getUserId() : null);
                    issueMap.put("reporterId", issue.getReporter() != null ? issue.getReporter().getUserId() : null);
                    issueMap.put("columnId", issue.getColumn().getId());
                    issueMap.put("order", issueOrders.getOrDefault(issue.getId(), 0));
                    
                    issueList.add(issueMap);
                }
                
                // 순서대로 정렬
                issueList.sort((a, b) -> (Integer)a.get("order") - (Integer)b.get("order"));
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
                        .icon("/assets/todo.png")
                        .project(project)
                        .orderIndex(1)
                        .isActive(true)
                        .build();
                columnRepository.save(todoColumn);
                log.debug("To Do 칼럼 생성됨: columnId={}", todoColumn.getId());

                // In Progress 칼럼
                BoardColumn inProgressColumn = BoardColumn.builder()
                        .title("In Progress")
                        .icon("/assets/inprogress.png")
                        .project(project)
                        .orderIndex(2)
                        .isActive(true)
                        .build();
                columnRepository.save(inProgressColumn);
                log.debug("In Progress 칼럼 생성됨: columnId={}", inProgressColumn.getId());

                // Done 칼럼
                BoardColumn doneColumn = BoardColumn.builder()
                        .title("Done")
                        .icon("/assets/done.png")
                        .project(project)
                        .orderIndex(3)
                        .isActive(true)
                        .build();
                columnRepository.save(doneColumn);
                log.debug("Done 칼럼 생성됨: columnId={}", doneColumn.getId());

                // Hold 칼럼
                BoardColumn holdColumn = BoardColumn.builder()
                        .title("Hold")
                        .icon("/assets/hold.png")
                        .project(project)
                        .orderIndex(4)
                        .isActive(true)
                        .build();
                columnRepository.save(holdColumn);
                log.debug("Hold 칼럼 생성됨: columnId={}", holdColumn.getId());
            }
        } catch (Exception e) {
            log.error("프로젝트 기본 칼럼 초기화 중 오류 발생: projectId={}", project.getId(), e);
            throw e;
        }
    }
} 