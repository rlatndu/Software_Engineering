package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.CommentRequest;
import com.example.softwareengineering.dto.CommentResponse;
import com.example.softwareengineering.dto.ActivityLogRequestDTO;
import com.example.softwareengineering.entity.Comment;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.ActivityType;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.CommentRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public CommentService(
        CommentRepository commentRepository,
        IssueRepository issueRepository,
        UserRepository userRepository,
        ActivityLogService activityLogService
    ) {
        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByIssue(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
        return commentRepository.findByIssueOrderByCreatedAtDesc(issue)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(Long issueId, String userId, CommentRequest request) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
            
        User author = userRepository.findByUserId(userId)
            .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        Comment comment = Comment.builder()
            .content(request.getContent())
            .issue(issue)
            .author(author)
            .build();

        Comment savedComment = commentRepository.save(comment);
        
        // 활동 내역 저장
        activityLogService.createActivityLog(ActivityLogRequestDTO.builder()
            .userId(author.getId())
            .type(ActivityType.COMMENT_CREATE)
            .title(issue.getTitle())  // 이슈 제목
            .content(request.getContent())  // 댓글 내용
            .projectId(issue.getProject().getId())
            .issueId(issue.getId())
            .commentId(savedComment.getId())
            .targetPage("/projects/" + issue.getProject().getId() + "/issues/" + issue.getId())
            .build());

        return toResponse(savedComment);
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, String userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CustomException("댓글을 찾을 수 없습니다."));

        // 작성자 본인만 수정 가능
        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new CustomException("댓글을 수정할 권한이 없습니다. 작성자만 수정할 수 있습니다.");
        }

        String oldContent = comment.getContent();
        comment.setContent(request.getContent());
        Comment savedComment = commentRepository.save(comment);
        
        // 활동 내역 저장
        activityLogService.createActivityLog(ActivityLogRequestDTO.builder()
            .userId(comment.getAuthor().getId())
            .type(ActivityType.COMMENT_UPDATE)
            .title(comment.getIssue().getTitle())  // 이슈 제목
            .content(oldContent + " → " + request.getContent())  // 변경 내용
            .projectId(comment.getIssue().getProject().getId())
            .issueId(comment.getIssue().getId())
            .commentId(comment.getId())
            .targetPage("/projects/" + comment.getIssue().getProject().getId() + "/issues/" + comment.getIssue().getId())
            .build());

        return toResponse(savedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CustomException("댓글을 찾을 수 없습니다."));

        // 작성자 본인만 삭제 가능
        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new CustomException("댓글을 삭제할 권한이 없습니다. 작성자만 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public void deleteAllCommentsByIssue(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));
        
        // 이슈에 연결된 모든 댓글 삭제
        commentRepository.deleteByIssue(issue);
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setContent(comment.getContent());
        response.setAuthorId(comment.getAuthor().getUserId());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }
} 