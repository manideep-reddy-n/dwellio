package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminResidentSummary;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Membership;
import com.dwellio.membership.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminResidentService {

    private final MembershipRepository membershipRepository;
    private final AuthorizationService authorizationService;

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminResidentSummary> list(String query, int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<Membership> residents = membershipRepository.searchActiveResidentsForAdmin(
                normalize(query),
                PageRequest.of(page, size)
        );
        return AdminPagedResponse.of(
                residents.map(this::toSummary).getContent(),
                page,
                size,
                residents.getTotalElements()
        );
    }

    private AdminResidentSummary toSummary(Membership membership) {
        return new AdminResidentSummary(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getUser().getEmail(),
                membership.getOrganization().getId(),
                membership.getOrganization().getName(),
                membership.getOrganization().getSlug(),
                membership.getJoinedAt()
        );
    }

    private static String normalize(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }
}
