package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminComplaintSummary;
import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.UpdateAdminComplaintRequest;
import com.dwellio.admin.service.AdminComplaintService;
import com.dwellio.domain.enums.ComplaintStatus;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/complaints")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminComplaintController {

    private final AdminComplaintService adminComplaintService;

    @GetMapping
    public AdminPagedResponse<AdminComplaintSummary> list(
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminComplaintService.list(status, query, page, size);
    }

    @PatchMapping("/{complaintId}")
    public AdminComplaintSummary update(
            @PathVariable UUID complaintId,
            @Valid @RequestBody UpdateAdminComplaintRequest request
    ) {
        return adminComplaintService.update(complaintId, request);
    }
}
