package com.dwellio.accommodation.service;

import com.dwellio.accommodation.dto.LayoutMapper;
import com.dwellio.accommodation.dto.UpdateAccommodationLayoutRequest;
import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.building.repository.BuildingRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Space;
import com.dwellio.floor.repository.FloorRepository;
import com.dwellio.space.repository.SpaceRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccommodationLayoutService {

    private final AccommodationGuard accommodationGuard;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final AccommodationEventPublisher eventPublisher;

    @Transactional
    public void updateLayout(UUID organizationId, UpdateAccommodationLayoutRequest request) {
        accommodationGuard.requireOrganization(organizationId);

        if (request.buildings() != null) {
            for (UpdateAccommodationLayoutRequest.LayoutItem item : request.buildings()) {
                Building building = buildingRepository.findActiveByIdAndOrganizationId(item.id(), organizationId)
                        .orElseThrow(() -> new NotFoundException("Building not found"));
                LayoutMapper.apply(building, item);
                buildingRepository.save(building);
            }
        }

        if (request.floors() != null) {
            for (UpdateAccommodationLayoutRequest.LayoutItem item : request.floors()) {
                Floor floor = floorRepository.findActiveByIdAndOrganizationId(item.id(), organizationId)
                        .orElseThrow(() -> new NotFoundException("Floor not found"));
                LayoutMapper.apply(floor, item);
                floorRepository.save(floor);
            }
        }

        if (request.spaces() != null) {
            for (UpdateAccommodationLayoutRequest.LayoutItem item : request.spaces()) {
                Space space = spaceRepository.findActiveByIdAndOrganizationId(item.id(), organizationId)
                        .orElseThrow(() -> new NotFoundException("Space not found"));
                LayoutMapper.apply(space, item);
                spaceRepository.save(space);
            }
        }

        eventPublisher.publishStructureChanged(organizationId);
    }
}
