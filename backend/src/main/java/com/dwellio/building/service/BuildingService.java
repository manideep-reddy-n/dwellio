package com.dwellio.building.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.occupancy.service.OccupancyStructureReleaseService;
import com.dwellio.building.dto.BuildingResponse;
import com.dwellio.building.dto.CreateBuildingRequest;
import com.dwellio.building.dto.UpdateBuildingRequest;
import com.dwellio.building.repository.BuildingRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Organization;
import com.dwellio.accommodation.service.AccommodationGuard;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final AccommodationGuard accommodationGuard;
    private final AccommodationEventPublisher eventPublisher;
    private final OccupancyStructureReleaseService occupancyStructureReleaseService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<BuildingResponse> list(UUID organizationId) {
        accommodationGuard.requireOrganization(organizationId);
        return buildingRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(BuildingService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BuildingResponse get(UUID organizationId, UUID buildingId) {
        return toResponse(getActiveBuilding(organizationId, buildingId));
    }

    @Transactional
    public BuildingResponse create(UUID organizationId, CreateBuildingRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);

        Building building = new Building();
        building.setId(UUID.randomUUID());
        building.setOrganization(organization);
        building.setName(request.name().trim());
        building.setCode(request.code());
        building = buildingRepository.save(building);

        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(building);
    }

    @Transactional
    public BuildingResponse update(UUID organizationId, UUID buildingId, UpdateBuildingRequest request) {
        Building building = getActiveBuilding(organizationId, buildingId);
        if (request.name() != null) {
            building.setName(request.name().trim());
        }
        if (request.code() != null) {
            building.setCode(request.code());
        }
        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(building);
    }

    @Transactional
    public void delete(UUID organizationId, UUID buildingId) {
        Building building = getActiveBuilding(organizationId, buildingId);
        occupancyStructureReleaseService.releaseCurrentForBuilding(organizationId, buildingId);
        building.setDeletedAt(Instant.now(clock));
        buildingRepository.save(building);
        eventPublisher.publishStructureChanged(organizationId);
    }

    public Building getActiveBuilding(UUID organizationId, UUID buildingId) {
        return buildingRepository.findActiveByIdAndOrganizationId(buildingId, organizationId)
                .orElseThrow(() -> new NotFoundException("Building not found"));
    }

    static BuildingResponse toResponse(Building building) {
        return new BuildingResponse(building.getId(), building.getName(), building.getCode());
    }
}
