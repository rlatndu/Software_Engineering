package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.UserIssueOrder;
import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.Issue;
import com.example.softwareengineering.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserIssueOrderRepository extends JpaRepository<UserIssueOrder, Long> {
    List<UserIssueOrder> findByUserAndColumnOrderByOrderIndexAsc(User user, BoardColumn column);
    void deleteByIssueId(Long issueId);
    List<UserIssueOrder> findByColumnId(Long columnId);
    Optional<UserIssueOrder> findByUserAndIssueAndColumn(User user, Issue issue, BoardColumn column);
} 