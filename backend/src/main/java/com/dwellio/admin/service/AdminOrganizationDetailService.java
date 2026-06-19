package com.dwellio.admin.service;

import com.dwellio.accommodation.dto.AccommodationVisualizationResponse;
import com.dwellio.accommodation.service.AccommodationVisualizationService;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.membership.dto.MembershipResponse;
import com.dwellio.membership.service.MembershipService;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.occupancy.service.OccupancyService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOrganizationDetailService {

    private final AuthorizationService authorizationService;
    private final MembershipService membershipService;
    private final AccommodationVisualizationService visualizationService;
    private final OccupancyService occupancyService;

    @Transactional(readOnly = true)
    public List<MembershipResponse> listResidents(UUID organizationId) {
        requirePlatformAdmin();
        return membershipService.listResidents(organizationId);
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> listMembers(UUID organizationId) {
        requirePlatformAdmin();
        return membershipService.listMemberships(organizationId);
    }

    @Transactional(readOnly = true)
    public AccommodationVisualizationResponse visualization(UUID organizationId) {
        requirePlatformAdmin();
        return visualizationService.getVisualizationForAdmin(organizationId);
    }

    @Transactional(readOnly = true)
    public List<OccupancyResponse> listOccupancies(UUID organizationId) {
        requirePlatformAdmin();
        return occupancyService.listForAdmin(organizationId);
    }

    private void requirePlatformAdmin() {
        if (!authorizationService.isPlatformAdmin()) {
            throw new ForbiddenException("Platform admin access required");
        }
    }
}
