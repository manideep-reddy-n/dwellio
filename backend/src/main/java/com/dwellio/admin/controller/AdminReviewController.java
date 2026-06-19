package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminReviewSummary;
import com.dwellio.admin.service.AdminReviewService;
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
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping
    public AdminPagedResponse<AdminReviewSummary> list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean includeHidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminReviewService.list(query, includeHidden, page, size);
    }

    @PostMapping("/{reviewId}/hide")
    public AdminReviewSummary hide(@PathVariable UUID reviewId) {
        return adminReviewService.hide(reviewId);
    }

    @PostMapping("/{reviewId}/remove")
    public AdminReviewSummary remove(@PathVariable UUID reviewId) {
        return adminReviewService.remove(reviewId);
    }

    @PostMapping("/{reviewId}/restore")
    public AdminReviewSummary restore(@PathVariable UUID reviewId) {
        return adminReviewService.restore(reviewId);
    }
}
