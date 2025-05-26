package com.example.softwareengineering.controller;

import com.example.softwareengineering.dto.CommentDto;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/comments")
@RequiredArgsConstructor
@Tag(name = "댓글 관리", description = "댓글 관리 API")
public class CommentController {
    private final CommentService commentService;

    @GetMapping
    @Operation(summary = "이슈의 댓글 목록 조회")
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long issueId) {
        return ResponseEntity.ok(commentService.getComments(issueId));
    }

    @PostMapping
    @Operation(summary = "새로운 댓글 작성")
    public ResponseEntity<CommentDto> createComment(
            @PathVariable Long issueId,
            @RequestParam String content,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commentService.createComment(issueId, content, user));
    }

    @PutMapping("/{commentId}")
    @Operation(summary = "댓글 수정")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long issueId,
            @PathVariable Long commentId,
            @RequestParam String content,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commentService.updateComment(commentId, content, user));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "댓글 삭제")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long issueId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {
        commentService.deleteComment(commentId, user);
        return ResponseEntity.ok().build();
    }
} 