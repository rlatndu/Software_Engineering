package com.example.softwareengineering.service;

import com.example.softwareengineering.entity.User;
import com.example.softwareengineering.entity.SiteMember;
import com.example.softwareengineering.entity.MemberRole;
import com.example.softwareengineering.repository.UserRepository;
import com.example.softwareengineering.repository.SiteMemberRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final SiteMemberRepository siteMemberRepository;

    public CustomUserDetailsService(UserRepository userRepository, SiteMemberRepository siteMemberRepository) {
        this.userRepository = userRepository;
        this.siteMemberRepository = siteMemberRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmailOrUserId(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 사용자의 모든 사이트 멤버십을 가져옴
        List<SiteMember> siteMembers = siteMemberRepository.findByUser(user);
        
        // 권한 목록 생성
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        
        // 기본적으로 ROLE_MEMBER 권한 부여
        authorities.add(new SimpleGrantedAuthority("ROLE_MEMBER"));
        
        // 사이트별 권한 추가
        for (SiteMember siteMember : siteMembers) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + siteMember.getRole().name() + "_SITE_" + siteMember.getSite().getId()));
        }

        return new org.springframework.security.core.userdetails.User(
            user.getUserId(),
            user.getPassword(),
            authorities
        );
    }
} 