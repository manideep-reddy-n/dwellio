package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminPaymentSummary;
import com.dwellio.admin.service.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping
    public AdminPagedResponse<AdminPaymentSummary> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminPaymentService.list(query, page, size);
    }
}
