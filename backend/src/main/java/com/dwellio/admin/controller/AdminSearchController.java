package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminSearchResponse;
import com.dwellio.admin.service.AdminSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/search")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminSearchController {

    private final AdminSearchService adminSearchService;

    @GetMapping
    public AdminSearchResponse search(@RequestParam String q) {
        return adminSearchService.search(q);
    }
}
