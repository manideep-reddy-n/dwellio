package com.dwellio.operations.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.domain.entity.Asset;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.common.security.RoleConstants;
import com.dwellio.organization.service.OrganizationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OperationsGuard {

    private final OrganizationService organizationService;

    public Organization requireOrganization(UUID organizationId) {
        return organizationService.findActiveOrganization(organizationId);
    }

    public void requireSameOrganization(UUID organizationId, UUID entityOrganizationId) {
        if (!organizationId.equals(entityOrganizationId)) {
            throw new BadRequestException("Resource does not belong to this organization");
        }
    }

    public void requireStaffMembership(Membership membership) {
        if (RoleConstants.RESIDENT.equals(membership.getRole().getName())) {
            throw new BadRequestException("Assignment target must be a staff member");
        }
    }

    public void requireAssetOrganization(UUID organizationId, Asset asset) {
        requireSameOrganization(organizationId, asset.getOrganization().getId());
    }
}
