package com.dwellio.accommodation.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.SpaceType;
import com.dwellio.organization.service.OrganizationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Validates accommodation-mode rules. Blocking flags take precedence over status enums
 * when evaluating allocatability (see {@link BlockStatusEvaluator}).
 */
@Service
@RequiredArgsConstructor
public class AccommodationGuard {

    private final OrganizationService organizationService;

    public Organization requireOrganization(UUID organizationId) {
        return organizationService.findActiveOrganization(organizationId);
    }

    public void requireBedBased(Organization organization) {
        if (organization.getAccommodationMode() != AccommodationMode.BED_BASED) {
            throw new BadRequestException("Bed operations are only supported for bed-based organizations");
        }
    }

    public void requireUnitBased(Organization organization) {
        if (organization.getAccommodationMode() != AccommodationMode.UNIT_BASED) {
            throw new BadRequestException("Unit operations are only supported for unit-based organizations");
        }
    }

    public void requireRoomSpace(Space space) {
        if (space.getSpaceType() != SpaceType.ROOM) {
            throw new BadRequestException("Beds can only be created under room spaces");
        }
    }

    public void requireUnitSpace(Space space) {
        if (space.getSpaceType() != SpaceType.UNIT) {
            throw new BadRequestException("Unit allocation requires a unit space");
        }
    }

    public void requireSameOrganization(UUID organizationId, UUID entityOrganizationId) {
        if (!organizationId.equals(entityOrganizationId)) {
            throw new BadRequestException("Resource does not belong to this organization");
        }
    }

    public void requireBedParentRoom(Bed bed) {
        requireRoomSpace(bed.getSpace());
    }
}
