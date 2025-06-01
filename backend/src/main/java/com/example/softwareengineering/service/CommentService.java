package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.CommentRequest;
import com.example.softwareengineering.dto.CommentResponse;
import com.example.softwareengineering.entity.Comment;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.CommentRepository;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private IssueRepository issueRepository;
    
    @Autowired
    private UserRepository userRepository;

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

        return toResponse(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, String userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CustomException("댓글을 찾을 수 없습니다."));

        // 작성자 본인만 수정 가능
        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new CustomException("댓글을 수정할 권한이 없습니다. 작성자만 수정할 수 있습니다.");
        }

        comment.setContent(request.getContent());
        return toResponse(commentRepository.save(comment));
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