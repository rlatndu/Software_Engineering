package com.example.softwareengineering.service;

import com.example.softwareengineering.dto.SubIssueRequest;
import com.example.softwareengineering.dto.SubIssueResponse;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.SubIssue;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.exception.CustomException;
import com.example.softwareengineering.repository.IssueRepository;
import com.example.softwareengineering.repository.SubIssueRepository;
import com.example.softwareengineering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubIssueService {
    @Autowired
    private SubIssueRepository subIssueRepository;
    @Autowired
    private IssueRepository issueRepository;
    @Autowired
    private UserRepository userRepository;

    // 하위이슈 생성 (이슈 담당자만)
    public SubIssueResponse createSubIssue(Long parentIssueId, SubIssueRequest request, Long userId) {
        Issue parent = issueRepository.findById(parentIssueId)
            .orElseThrow(() -> new CustomException("상위 이슈를 찾을 수 없습니다."));
        if (parent.getAssignee() == null || !parent.getAssignee().getId().equals(userId)) {
            throw new CustomException("하위이슈를 생성할 권한이 없습니다.");
        }
        SubIssue sub = new SubIssue();
        sub.setParentIssue(parent);
        sub.setName(request.getName());
        sub.setChecked(false);
        sub = subIssueRepository.save(sub);
        return toResponse(sub);
    }

    // 하위이슈 삭제 (이슈 담당자만)
    public void deleteSubIssue(Long subIssueId, Long userId) {
        SubIssue sub = subIssueRepository.findById(subIssueId)
            .orElseThrow(() -> new CustomException("하위이슈를 찾을 수 없습니다."));
        Issue parent = sub.getParentIssue();
        if (parent.getAssignee() == null || !parent.getAssignee().getId().equals(userId)) {
            throw new CustomException("하위이슈를 삭제할 권한이 없습니다.");
        }
        subIssueRepository.delete(sub);
    }

    // 하위이슈 체크/해제 (이슈 담당자만)
    public SubIssueResponse checkSubIssue(Long subIssueId, boolean checked, Long userId) {
        SubIssue sub = subIssueRepository.findById(subIssueId)
            .orElseThrow(() -> new CustomException("하위이슈를 찾을 수 없습니다."));
        Issue parent = sub.getParentIssue();
        if (parent.getAssignee() == null || !parent.getAssignee().getId().equals(userId)) {
            throw new CustomException("하위이슈 상태를 변경할 권한이 없습니다.");
        }
        sub.setChecked(checked);
        sub = subIssueRepository.save(sub);
        return toResponse(sub);
    }

    // 하위이슈 목록 조회 (이슈 담당자만)
    public List<SubIssueResponse> getSubIssues(Long parentIssueId, Long userId) {
        Issue parent = issueRepository.findById(parentIssueId)
            .orElseThrow(() -> new CustomException("상위 이슈를 찾을 수 없습니다."));
        if (parent.getAssignee() == null || !parent.getAssignee().getId().equals(userId)) {
            throw new CustomException("하위이슈를 조회할 권한이 없습니다.");
        }
        List<SubIssue> list = subIssueRepository.findByParentIssue(parent);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private SubIssueResponse toResponse(SubIssue sub) {
        SubIssueResponse dto = new SubIssueResponse();
        dto.setId(sub.getId());
        dto.setName(sub.getName());
        dto.setChecked(sub.isChecked());
        return dto;
    }
} 