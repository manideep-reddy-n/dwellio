package com.dwellio.floor.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.building.service.BuildingService;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Organization;
import com.dwellio.floor.dto.CreateFloorRequest;
import com.dwellio.floor.dto.FloorResponse;
import com.dwellio.floor.dto.UpdateFloorRequest;
import com.dwellio.floor.repository.FloorRepository;
import com.dwellio.occupancy.service.OccupancyStructureReleaseService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingService buildingService;
    private final AccommodationGuard accommodationGuard;
    private final AccommodationEventPublisher eventPublisher;
    private final OccupancyStructureReleaseService occupancyStructureReleaseService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<FloorResponse> listByBuilding(UUID organizationId, UUID buildingId) {
        buildingService.getActiveBuilding(organizationId, buildingId);
        return floorRepository.findAllActiveByBuildingId(buildingId).stream()
                .map(FloorService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FloorResponse get(UUID organizationId, UUID floorId) {
        return toResponse(getActiveFloor(organizationId, floorId));
    }

    @Transactional
    public FloorResponse create(UUID organizationId, UUID buildingId, CreateFloorRequest request) {
        Building building = buildingService.getActiveBuilding(organizationId, buildingId);
        Organization organization = accommodationGuard.requireOrganization(organizationId);

        if (floorRepository.existsActiveByBuildingIdAndFloorNumber(buildingId, request.floorNumber())) {
            throw new ConflictException("Floor number already exists in this building");
        }

        Floor floor = new Floor();
        floor.setId(UUID.randomUUID());
        floor.setBuilding(building);
        floor.setOrganization(organization);
        floor.setFloorNumber(request.floorNumber());
        floor.setName(request.name());
        floor = floorRepository.save(floor);

        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(floor);
    }

    @Transactional
    public FloorResponse update(UUID organizationId, UUID floorId, UpdateFloorRequest request) {
        Floor floor = getActiveFloor(organizationId, floorId);
        if (request.floorNumber() != null && request.floorNumber() != floor.getFloorNumber()) {
            if (floorRepository.existsActiveByBuildingIdAndFloorNumber(
                    floor.getBuilding().getId(), request.floorNumber())) {
                throw new ConflictException("Floor number already exists in this building");
            }
            floor.setFloorNumber(request.floorNumber());
        }
        if (request.name() != null) {
            floor.setName(request.name());
        }
        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(floor);
    }

    @Transactional
    public void delete(UUID organizationId, UUID floorId) {
        Floor floor = getActiveFloor(organizationId, floorId);
        occupancyStructureReleaseService.releaseCurrentForFloor(organizationId, floorId);
        floor.setDeletedAt(Instant.now(clock));
        floorRepository.save(floor);
        eventPublisher.publishStructureChanged(organizationId);
    }

    public Floor getActiveFloor(UUID organizationId, UUID floorId) {
        return floorRepository.findActiveByIdAndOrganizationId(floorId, organizationId)
                .orElseThrow(() -> new NotFoundException("Floor not found"));
    }

    static FloorResponse toResponse(Floor floor) {
        return new FloorResponse(
                floor.getId(),
                floor.getBuilding().getId(),
                floor.getFloorNumber(),
                floor.getName()
        );
    }
}
