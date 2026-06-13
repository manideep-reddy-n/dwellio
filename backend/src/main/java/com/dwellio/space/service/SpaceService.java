package com.dwellio.space.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.accommodation.service.BlockStatusEvaluator;
import com.dwellio.accommodation.service.SpaceStatusProjectionService;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.SpaceStatus;
import com.dwellio.domain.enums.SpaceType;
import com.dwellio.floor.service.FloorService;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.space.dto.CreateSpaceRequest;
import com.dwellio.space.dto.SpaceResponse;
import com.dwellio.space.dto.UpdateSpaceRequest;
import com.dwellio.space.repository.SpaceRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final FloorService floorService;
    private final AccommodationGuard accommodationGuard;
    private final SpaceStatusProjectionService statusProjectionService;
    private final OccupancyRepository occupancyRepository;
    private final AccommodationEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<SpaceResponse> listByFloor(UUID organizationId, UUID floorId) {
        floorService.getActiveFloor(organizationId, floorId);
        return spaceRepository.findAllActiveByFloorId(floorId).stream()
                .map(SpaceService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpaceResponse get(UUID organizationId, UUID spaceId) {
        return toResponse(getActiveSpace(organizationId, spaceId));
    }

    @Transactional
    public SpaceResponse create(UUID organizationId, UUID floorId, CreateSpaceRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        Floor floor = floorService.getActiveFloor(organizationId, floorId);
        SpaceType spaceType = resolveSpaceType(organization);

        String identifier = request.identifier().trim();
        if (spaceRepository.existsActiveByFloorIdAndSpaceTypeAndIdentifier(floorId, spaceType, identifier)) {
            throw new ConflictException("Space identifier already exists on this floor");
        }

        Space space = new Space();
        space.setId(UUID.randomUUID());
        space.setFloor(floor);
        space.setOrganization(organization);
        space.setSpaceType(spaceType);
        space.setIdentifier(identifier);
        space.setDisplayName(request.displayName());
        space.setStatus(SpaceStatus.AVAILABLE);
        space.setCapacity(spaceType == SpaceType.ROOM ? 0 : 1);
        space.setBlocked(false);
        space = spaceRepository.save(space);

        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(space);
    }

    @Transactional
    public SpaceResponse update(UUID organizationId, UUID spaceId, UpdateSpaceRequest request) {
        Space space = getActiveSpace(organizationId, spaceId);

        if (request.identifier() != null && !request.identifier().trim().equals(space.getIdentifier())) {
            String identifier = request.identifier().trim();
            if (spaceRepository.existsActiveByFloorIdAndSpaceTypeAndIdentifier(
                    space.getFloor().getId(), space.getSpaceType(), identifier)) {
                throw new ConflictException("Space identifier already exists on this floor");
            }
            space.setIdentifier(identifier);
        }
        if (request.displayName() != null) {
            space.setDisplayName(request.displayName());
        }
        if (request.blocked() != null) {
            BlockStatusEvaluator.applySpaceBlock(space, request.blocked());
            if (space.getSpaceType() == SpaceType.ROOM) {
                statusProjectionService.recomputeRoomStatus(space.getId());
            } else {
                statusProjectionService.recomputeUnitStatus(space.getId());
            }
        }

        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(space);
    }

    @Transactional
    public void delete(UUID organizationId, UUID spaceId) {
        Space space = getActiveSpace(organizationId, spaceId);
        if (space.getSpaceType() == SpaceType.UNIT && occupancyRepository.existsCurrentByUnitSpaceId(spaceId)) {
            throw new BadRequestException("Cannot delete a unit with a current occupancy");
        }
        space.setDeletedAt(Instant.now(clock));
        spaceRepository.save(space);
        eventPublisher.publishStructureChanged(organizationId);
    }

    public Space getActiveSpace(UUID organizationId, UUID spaceId) {
        return spaceRepository.findActiveByIdAndOrganizationId(spaceId, organizationId)
                .orElseThrow(() -> new NotFoundException("Space not found"));
    }

    private SpaceType resolveSpaceType(Organization organization) {
        return organization.getAccommodationMode() == AccommodationMode.BED_BASED
                ? SpaceType.ROOM
                : SpaceType.UNIT;
    }

    static SpaceResponse toResponse(Space space) {
        return new SpaceResponse(
                space.getId(),
                space.getFloor().getId(),
                space.getSpaceType(),
                space.getIdentifier(),
                space.getDisplayName(),
                space.getStatus(),
                space.getCapacity(),
                space.isBlocked()
        );
    }
}
