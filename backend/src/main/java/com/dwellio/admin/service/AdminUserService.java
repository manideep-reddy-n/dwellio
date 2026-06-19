package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminUserSummary;
import com.dwellio.audit.service.PlatformAuditService;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.User;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;
    private final PlatformAuditService auditService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminUserSummary> list(String query, int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<User> users = userRepository.searchForAdmin(normalize(query), PageRequest.of(page, size));
        return AdminPagedResponse.of(
                users.map(this::toSummary).getContent(),
                page,
                size,
                users.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public AdminUserSummary getById(UUID userId) {
        authorizationService.requirePlatformAdmin();
        return toSummary(userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found")));
    }

    @Transactional
    public AdminUserSummary suspend(UUID userId) {
        return setActiveState(userId, false, "USER_SUSPENDED");
    }

    @Transactional
    public AdminUserSummary activate(UUID userId) {
        return setActiveState(userId, true, "USER_ACTIVATED");
    }

    @Transactional
    public AdminUserSummary ban(UUID userId) {
        return setActiveState(userId, false, "USER_BANNED");
    }

    private AdminUserSummary setActiveState(UUID userId, boolean active, String action) {
        authorizationService.requirePlatformAdmin();
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        boolean wasActive = user.getDeletedAt() == null;
        Instant previousDeletedAt = user.getDeletedAt();

        if (active) {
            user.setDeletedAt(null);
        } else {
            user.setDeletedAt(Instant.now(clock));
        }
        User saved = userRepository.save(user);

        auditService.recordForCurrentUser(
                action,
                "USER",
                userId,
                null,
                wasActive ? "active" : "inactive",
                active ? "active" : action
        );

        return toSummary(saved);
    }

    private AdminUserSummary toSummary(User user) {
        return new AdminUserSummary(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.isPlatformAdmin(),
                user.getDeletedAt() == null,
                user.isEmailVerified(),
                user.getCreatedAt(),
                user.getDeletedAt()
        );
    }

    private static String normalize(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }
}
