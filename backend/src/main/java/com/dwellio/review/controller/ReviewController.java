package com.dwellio.review.controller;

import com.dwellio.review.dto.CreateReviewRequest;
import com.dwellio.review.dto.ReportReviewRequest;
import com.dwellio.review.dto.ReviewResponse;
import com.dwellio.review.dto.UpdateReviewRequest;
import com.dwellio.review.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'review:create')")
    public ReviewResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return reviewService.create(organizationId, request);
    }

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'review:read')")
    public List<ReviewResponse> list(@PathVariable UUID organizationId) {
        return reviewService.list(organizationId);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'review:update_own')")
    public ReviewResponse getMine(@PathVariable UUID organizationId) {
        return reviewService.getMine(organizationId);
    }

    @PutMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'review:update_own')")
    public ReviewResponse updateMine(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        return reviewService.updateMine(organizationId, request);
    }

    @PostMapping("/{reviewId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.requireMembership(#organizationId) != null")
    public void report(
            @PathVariable UUID organizationId,
            @PathVariable UUID reviewId,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        reviewService.report(organizationId, reviewId, request);
    }
}
