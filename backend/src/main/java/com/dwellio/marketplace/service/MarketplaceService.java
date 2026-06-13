package com.dwellio.marketplace.service;

import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.marketplace.dto.PublicOrganizationResponse;
import com.dwellio.organization.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private final OrganizationService organizationService;

    @Transactional(readOnly = true)
    public PublicOrganizationResponse getPublicProfileBySlug(String slug) {
        var organization = organizationService.findActiveOrganizationBySlug(slug);
        if (organization.getStatus() != OrganizationStatus.VERIFIED) {
            throw new NotFoundException("Organization not found");
        }
        return PublicOrganizationResponse.from(organization);
    }
}
