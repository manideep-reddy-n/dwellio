package com.dwellio.common.security;

import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Organization;
import com.dwellio.organization.repository.OrganizationRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TenantContext {

    private final OrganizationRepository organizationRepository;

    public Organization requireOrganization(UUID organizationId) {
        return organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    public Organization requireOrganizationBySlug(String slug) {
        return organizationRepository.findActiveBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    public UUID resolveOrganizationId(UUID organizationId) {
        return requireOrganization(organizationId).getId();
    }

    public UUID resolveOrganizationIdBySlug(String slug) {
        return requireOrganizationBySlug(slug).getId();
    }
}
