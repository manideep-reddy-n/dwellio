package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminSearchResponse;
import com.dwellio.admin.dto.AdminSearchResponse.AdminSearchHit;
import com.dwellio.common.security.AuthorizationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSearchService {

    private final AuthorizationService authorizationService;
    private final AdminUserService adminUserService;
    private final AdminOrganizationService adminOrganizationService;
    private final AdminResidentService adminResidentService;
    private final AdminPaymentService adminPaymentService;
    private final AdminComplaintService adminComplaintService;
    private final AdminReviewService adminReviewService;

    @Transactional(readOnly = true)
    public AdminSearchResponse search(String query) {
        authorizationService.requirePlatformAdmin();
        String q = query != null && !query.isBlank() ? query.trim() : "";

        if (q.isBlank()) {
            return new AdminSearchResponse(q, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }

        var users = adminUserService.list(q, 0, 5).content().stream()
                .map(u -> new AdminSearchHit(
                        u.id().toString(),
                        "USER",
                        u.fullName(),
                        u.email(),
                        "/admin/users/" + u.id()
                ))
                .toList();

        var organizations = adminOrganizationService.listAll(null).stream()
                .filter(o -> matches(q, o.name(), o.slug(), o.city()))
                .limit(5)
                .map(o -> new AdminSearchHit(
                        o.id().toString(),
                        "ORGANIZATION",
                        o.name(),
                        o.slug() + " · " + o.status(),
                        "/admin/organizations/" + o.id()
                ))
                .toList();

        var residents = adminResidentService.list(q, 0, 5).content().stream()
                .map(r -> new AdminSearchHit(
                        r.membershipId().toString(),
                        "RESIDENT",
                        r.fullName(),
                        r.organizationName(),
                        "/admin/users/" + r.userId()
                ))
                .toList();

        var payments = adminPaymentService.list(q, 0, 5).content().stream()
                .map(p -> new AdminSearchHit(
                        p.id().toString(),
                        "PAYMENT",
                        p.residentName(),
                        p.organizationName() + " · ₹" + p.amount(),
                        "/admin/organizations/" + p.organizationId()
                ))
                .toList();

        var complaints = adminComplaintService.list(null, q, 0, 5).content().stream()
                .map(c -> new AdminSearchHit(
                        c.id().toString(),
                        "COMPLAINT",
                        c.title(),
                        c.organizationName(),
                        "/admin/organizations/" + c.organizationId()
                ))
                .toList();

        var reviews = adminReviewService.list(q, false, 0, 5).content().stream()
                .map(r -> new AdminSearchHit(
                        r.id().toString(),
                        "REVIEW",
                        r.authorName(),
                        r.organizationName() + " · " + r.rating() + "/5",
                        "/admin/organizations/" + r.organizationId()
                ))
                .toList();

        return new AdminSearchResponse(q, users, organizations, residents, payments, complaints, reviews);
    }

    private static boolean matches(String query, String... fields) {
        String normalized = query.toLowerCase();
        for (String field : fields) {
            if (field != null && field.toLowerCase().contains(normalized)) {
                return true;
            }
        }
        return false;
    }
}
