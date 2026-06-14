package com.dwellio.accommodation.service;

import com.dwellio.accommodation.dto.AccommodationVisualizationResponse;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse.BedNode;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse.BuildingNode;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse.FloorNode;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse.OccupantSummary;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse.SpaceNode;
import com.dwellio.accommodation.dto.LayoutMapper;
import com.dwellio.bed.repository.BedRepository;
import com.dwellio.building.repository.BuildingRepository;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.floor.repository.FloorRepository;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.space.repository.SpaceRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccommodationVisualizationService {

    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final BedRepository bedRepository;
    private final OccupancyRepository occupancyRepository;

    @Transactional(readOnly = true)
    public AccommodationVisualizationResponse getVisualization(UUID organizationId) {
        MembershipContext viewer = authorizationService.requireMembership(organizationId);
        boolean staffView = viewer.isOwner() || viewer.hasPermission("building:manage");
        return buildVisualization(organizationId, staffView, viewer.getMembershipId());
    }

    @Transactional(readOnly = true)
    public AccommodationVisualizationResponse getVisualizationForAdmin(UUID organizationId) {
        if (!authorizationService.isPlatformAdmin()) {
            throw new com.dwellio.common.exception.ForbiddenException("Platform admin access required");
        }
        return buildVisualization(organizationId, true, null);
    }

    private AccommodationVisualizationResponse buildVisualization(
            UUID organizationId,
            boolean staffView,
            UUID viewerMembershipId
    ) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        List<Building> buildings = buildingRepository.findAllActiveByOrganizationId(organizationId);

        Map<UUID, Occupancy> currentBedOccupancies = occupancyRepository.findAllByOrganizationId(organizationId)
                .stream()
                .filter(Occupancy::isCurrent)
                .filter(o -> o.getBed() != null)
                .collect(Collectors.toMap(o -> o.getBed().getId(), Function.identity(), (a, b) -> a));

        Map<UUID, Occupancy> currentUnitOccupancies = occupancyRepository.findAllByOrganizationId(organizationId)
                .stream()
                .filter(Occupancy::isCurrent)
                .filter(o -> o.getUnitSpace() != null)
                .collect(Collectors.toMap(o -> o.getUnitSpace().getId(), Function.identity(), (a, b) -> a));

        List<BuildingNode> buildingNodes = new ArrayList<>();
        for (Building building : buildings) {
            List<FloorNode> floorNodes = new ArrayList<>();
            for (Floor floor : floorRepository.findAllActiveByBuildingId(building.getId())) {
                List<SpaceNode> spaceNodes = new ArrayList<>();
                for (Space space : spaceRepository.findAllActiveByFloorId(floor.getId())) {
                    List<BedNode> bedNodes = new ArrayList<>();
                    if (organization.getAccommodationMode() == AccommodationMode.BED_BASED) {
                        for (Bed bed : bedRepository.findAllActiveBySpaceId(space.getId())) {
                            Occupancy bedOccupancy = currentBedOccupancies.get(bed.getId());
                            bedNodes.add(new BedNode(
                                    bed.getId(),
                                    bed.getBedLabel(),
                                    bed.getStatus(),
                                    bed.isBlocked(),
                                    toOccupantSummary(bedOccupancy, staffView, viewerMembershipId)
                            ));
                        }
                    }

                    Occupancy unitOccupancy = currentUnitOccupancies.get(space.getId());
                    spaceNodes.add(new SpaceNode(
                            space.getId(),
                            space.getSpaceType(),
                            space.getIdentifier(),
                            space.getDisplayName(),
                            space.getStatus(),
                            space.getCapacity(),
                            space.isBlocked(),
                            bedNodes,
                            organization.getAccommodationMode() == AccommodationMode.UNIT_BASED
                                    ? toOccupantSummary(unitOccupancy, staffView, viewerMembershipId)
                                    : null,
                            LayoutMapper.toDto(space)
                    ));
                }
                floorNodes.add(new FloorNode(
                        floor.getId(),
                        floor.getFloorNumber(),
                        floor.getName(),
                        spaceNodes,
                        LayoutMapper.toDto(floor)
                ));
            }
            buildingNodes.add(new BuildingNode(
                    building.getId(),
                    building.getName(),
                    building.getCode(),
                    floorNodes,
                    LayoutMapper.toDto(building)
            ));
        }

        return new AccommodationVisualizationResponse(
                organizationId,
                organization.getAccommodationMode(),
                buildingNodes
        );
    }

    private OccupantSummary toOccupantSummary(
            Occupancy occupancy,
            boolean staffView,
            UUID viewerMembershipId
    ) {
        if (occupancy == null) {
            return null;
        }
        String residentName;
        if (staffView) {
            residentName = occupancy.getMembership().getUser().getFullName();
        } else if (occupancy.getMembership().getId().equals(viewerMembershipId)) {
            residentName = "You";
        } else {
            residentName = "Occupied";
        }
        return new OccupantSummary(
                occupancy.getMembership().getId(),
                residentName,
                occupancy.getMoveInDate()
        );
    }
}
