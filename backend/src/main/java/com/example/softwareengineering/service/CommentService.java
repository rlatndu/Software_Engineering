package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.CommentDto;
import com.example.softwareengineering.entity.Comment;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.Project;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.CommentRepository;
import com.example.softwareengineering.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;

    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtDesc(issueId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto createComment(Long issueId, String content, User user) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new CustomException("이슈를 찾을 수 없습니다."));

        // 프로젝트 참여 여부 체크
        if (!isProjectMember(issue.getProject(), user)) {
            throw new CustomException("프로젝트에 참여한 사용자만 댓글을 작성할 수 있습니다.");
        }

        // 댓글 내용 검증
        if (content == null || content.trim().isEmpty()) {
            throw new CustomException("댓글 내용은 공백일 수 없습니다.");
        }

        if (content.length() > 1000) {
            throw new CustomException("댓글은 최대 1000자까지 입력 가능합니다.");
        }

        Comment comment = Comment.builder()
                .content(content)
                .issue(issue)
                .user(user)
                .build();

        return convertToDto(commentRepository.save(comment));
    }

    @Transactional
    public CommentDto updateComment(Long commentId, String content, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException("댓글을 찾을 수 없습니다."));

        // 작성자 체크
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new CustomException("자신이 작성한 댓글만 수정할 수 있습니다.");
        }

        // 댓글 내용 검증
        if (content == null || content.trim().isEmpty()) {
            throw new CustomException("댓글 내용은 공백일 수 없습니다.");
        }

        if (content.length() > 1000) {
            throw new CustomException("댓글은 최대 1000자까지 입력 가능합니다.");
        }

        comment.setContent(content);
        return convertToDto(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException("댓글을 찾을 수 없습니다."));

        // 작성자 체크
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new CustomException("자신이 작성한 댓글만 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }

    private boolean isProjectMember(Project project, User user) {
        return project.getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(user.getId()));
    }

    private CommentDto convertToDto(Comment comment) {
        return CommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .issueId(comment.getIssue().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getUserId())
                .userProfileImage(comment.getUser().getProfileImage())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
} 