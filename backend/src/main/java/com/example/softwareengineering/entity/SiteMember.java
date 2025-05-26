package com.example.softwareengineering.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "site_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role;

    // --- Getter / Setter ---
    public Long getId() { return id; }
    public Site getSite() { return site; }
    public void setSite(Site site) { this.site = site; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public MemberRole getRole() { return role; }
    public void setRole(MemberRole role) { this.role = role; }
} 