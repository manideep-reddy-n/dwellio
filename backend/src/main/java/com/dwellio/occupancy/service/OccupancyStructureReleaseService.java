package com.dwellio.occupancy.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.accommodation.event.OccupancyReleasedEvent;
import com.dwellio.accommodation.service.SpaceStatusProjectionService;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.occupancy.repository.OccupancyRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OccupancyStructureReleaseService {

    private final OccupancyRepository occupancyRepository;
    private final SpaceStatusProjectionService statusProjectionService;
    private final AccommodationEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional
    public int releaseCurrentForBuilding(UUID organizationId, UUID buildingId) {
        return releaseAll(occupancyRepository.findCurrentByBuildingId(organizationId, buildingId), organizationId);
    }

    @Transactional
    public int releaseCurrentForFloor(UUID organizationId, UUID floorId) {
        return releaseAll(occupancyRepository.findCurrentByFloorId(organizationId, floorId), organizationId);
    }

    @Transactional
    public int releaseCurrentForSpace(UUID organizationId, UUID spaceId) {
        return releaseAll(occupancyRepository.findCurrentBySpaceId(organizationId, spaceId), organizationId);
    }

    @Transactional
    public int releaseCurrentForBed(UUID organizationId, UUID bedId) {
        return releaseAll(occupancyRepository.findCurrentByBedId(organizationId, bedId), organizationId);
    }

    private int releaseAll(List<Occupancy> occupancies, UUID organizationId) {
        LocalDate moveOutDate = LocalDate.now(clock);
        int released = 0;

        for (Occupancy occupancy : occupancies) {
            if (!occupancy.isCurrent()) {
                continue;
            }

            occupancy.setCurrent(false);
            occupancy.setMoveOutDate(moveOutDate);
            occupancyRepository.save(occupancy);

            UUID bedId = occupancy.getBed() != null ? occupancy.getBed().getId() : null;
            UUID unitSpaceId = occupancy.getUnitSpace() != null ? occupancy.getUnitSpace().getId() : null;

            if (bedId != null) {
                statusProjectionService.markBedAvailable(bedId);
            }
            if (unitSpaceId != null) {
                statusProjectionService.recomputeUnitStatus(unitSpaceId);
            }

            eventPublisher.publishOccupancyReleased(new OccupancyReleasedEvent(
                    organizationId,
                    occupancy.getId(),
                    occupancy.getMembership().getId(),
                    bedId,
                    unitSpaceId
            ));
            released++;
        }

        return released;
    }
}
