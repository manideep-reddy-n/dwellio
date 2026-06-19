package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminUserSummary;
import com.dwellio.admin.service.AdminUserService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public AdminPagedResponse<AdminUserSummary> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminUserService.list(query, page, size);
    }

    @GetMapping("/{userId}")
    public AdminUserSummary get(@PathVariable UUID userId) {
        return adminUserService.getById(userId);
    }

    @PostMapping("/{userId}/suspend")
    public AdminUserSummary suspend(@PathVariable UUID userId) {
        return adminUserService.suspend(userId);
    }

    @PostMapping("/{userId}/activate")
    public AdminUserSummary activate(@PathVariable UUID userId) {
        return adminUserService.activate(userId);
    }

    @PostMapping("/{userId}/ban")
    public AdminUserSummary ban(@PathVariable UUID userId) {
        return adminUserService.ban(userId);
    }
}
