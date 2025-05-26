package com.example.softwareengineering.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sub_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubIssue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    private Issue parentIssue;

    @Builder.Default
    @Column(nullable = false)
    private boolean completed = false;

    @Builder.Default
    private boolean checked = false;

    // --- Getter / Setter ---
    public Long getId() { return id; }
    public Issue getParentIssue() { return parentIssue; }
    public void setParentIssue(Issue parentIssue) { this.parentIssue = parentIssue; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public boolean isChecked() { return checked; }
    public void setChecked(boolean checked) { this.checked = checked; }
} 