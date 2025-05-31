package com.example.softwareengineering.repository;

import com.example.softwareengineering.entity.BoardColumn;
import com.example.softwareengineering.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByProjectAndIsActiveTrueOrderByOrderIndexAsc(Project project);
    
    @Modifying
    @Query("DELETE FROM BoardColumn bc WHERE bc.project = :project")
    void deleteByProject(Project project);
} 