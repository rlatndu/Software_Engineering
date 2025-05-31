package com.example.softwareengineering.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sites", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "owner_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SiteMember> members = new ArrayList<>();

    private java.time.LocalDateTime createdAt;

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public List<SiteMember> getMembers() {
        return members;
    }

    public void setMembers(List<SiteMember> members) {
        this.members = members;
    }

    public void addMember(SiteMember member) {
        members.add(member);
        member.setSite(this);
    }

    public void removeMember(SiteMember member) {
        members.remove(member);
        member.setSite(null);
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 