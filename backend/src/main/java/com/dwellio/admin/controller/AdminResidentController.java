package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminResidentSummary;
import com.dwellio.admin.service.AdminResidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/residents")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminResidentController {

    private final AdminResidentService adminResidentService;

    @GetMapping
    public AdminPagedResponse<AdminResidentSummary> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminResidentService.list(query, page, size);
    }
}
