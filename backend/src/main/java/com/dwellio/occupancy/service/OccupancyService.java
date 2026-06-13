package com.dwellio.occupancy.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.accommodation.event.OccupancyAllocatedEvent;
import com.dwellio.accommodation.event.OccupancyReleasedEvent;
import com.dwellio.accommodation.event.OccupancyTransferredEvent;
import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.accommodation.service.BlockStatusEvaluator;
import com.dwellio.accommodation.service.SpaceStatusProjectionService;
import com.dwellio.bed.service.BedService;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.OccupancyTarget;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.occupancy.dto.AllocateOccupancyRequest;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.occupancy.dto.ReleaseOccupancyRequest;
import com.dwellio.occupancy.dto.TransferOccupancyRequest;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.space.service.SpaceService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OccupancyService {

    private final OccupancyRepository occupancyRepository;
    private final MembershipRepository membershipRepository;
    private final AccommodationGuard accommodationGuard;
    private final BedService bedService;
    private final SpaceService spaceService;
    private final SpaceStatusProjectionService statusProjectionService;
    private final AccommodationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<OccupancyResponse> list(UUID organizationId, UUID membershipId) {
        accommodationGuard.requireOrganization(organizationId);
        List<Occupancy> occupancies = membershipId == null
                ? occupancyRepository.findAllByOrganizationId(organizationId)
                : occupancyRepository.findAllByOrganizationIdAndMembershipId(organizationId, membershipId);
        return occupancies.stream().map(OccupancyService::toResponse).toList();
    }

    @Transactional
    public OccupancyResponse allocate(UUID organizationId, AllocateOccupancyRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        Membership membership = requireActiveMembership(organizationId, request.membershipId());

        if (occupancyRepository.existsCurrentByMembershipId(membership.getId())) {
            throw new ConflictException("Membership already has a current occupancy. Use transfer instead.");
        }

        Occupancy occupancy;
        if (organization.getAccommodationMode() == AccommodationMode.BED_BASED) {
            occupancy = allocateBed(organization, membership, request);
        } else {
            occupancy = allocateUnit(organization, membership, request);
        }

        eventPublisher.publishOccupancyAllocated(new OccupancyAllocatedEvent(
                organizationId,
                occupancy.getId(),
                membership.getId(),
                occupancy.getBed() != null ? occupancy.getBed().getId() : null,
                occupancy.getUnitSpace() != null ? occupancy.getUnitSpace().getId() : null
        ));

        return toResponse(occupancy);
    }

    @Transactional
    public OccupancyResponse transfer(UUID organizationId, TransferOccupancyRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        Membership membership = requireActiveMembership(organizationId, request.membershipId());

        Occupancy current = occupancyRepository.findCurrentByMembershipId(membership.getId())
                .orElseThrow(() -> new BadRequestException("Membership has no current occupancy to transfer"));

        UUID previousBedId = current.getBed() != null ? current.getBed().getId() : null;
        UUID previousUnitSpaceId = current.getUnitSpace() != null ? current.getUnitSpace().getId() : null;

        current.setCurrent(false);
        current.setMoveOutDate(request.transferDate());
        occupancyRepository.save(current);

        if (previousBedId != null) {
            statusProjectionService.markBedAvailable(previousBedId);
        }
        if (previousUnitSpaceId != null) {
            statusProjectionService.recomputeUnitStatus(previousUnitSpaceId);
        }

        Occupancy newOccupancy;
        if (organization.getAccommodationMode() == AccommodationMode.BED_BASED) {
            if (request.targetBedId() == null) {
                throw new BadRequestException("targetBedId is required for bed-based transfers");
            }
            if (request.targetBedId().equals(previousBedId)) {
                throw new BadRequestException("Transfer target must differ from current bed");
            }
            newOccupancy = createBedOccupancy(
                    organization,
                    membership,
                    bedService.getActiveBed(organizationId, request.targetBedId()),
                    request.transferDate()
            );
        } else {
            if (request.targetUnitSpaceId() == null) {
                throw new BadRequestException("targetUnitSpaceId is required for unit-based transfers");
            }
            if (request.targetUnitSpaceId().equals(previousUnitSpaceId)) {
                throw new BadRequestException("Transfer target must differ from current unit");
            }
            newOccupancy = createUnitOccupancy(
                    organization,
                    membership,
                    spaceService.getActiveSpace(organizationId, request.targetUnitSpaceId()),
                    request.transferDate()
            );
        }

        eventPublisher.publishOccupancyTransferred(new OccupancyTransferredEvent(
                organizationId,
                membership.getId(),
                current.getId(),
                newOccupancy.getId(),
                previousBedId,
                newOccupancy.getBed() != null ? newOccupancy.getBed().getId() : null,
                previousUnitSpaceId,
                newOccupancy.getUnitSpace() != null ? newOccupancy.getUnitSpace().getId() : null
        ));

        return toResponse(newOccupancy);
    }

    @Transactional
    public OccupancyResponse release(
            UUID organizationId,
            UUID occupancyId,
            ReleaseOccupancyRequest request
    ) {
        accommodationGuard.requireOrganization(organizationId);

        Occupancy occupancy = occupancyRepository.findByIdAndOrganizationId(occupancyId, organizationId)
                .orElseThrow(() -> new NotFoundException("Occupancy not found"));
        if (!occupancy.isCurrent()) {
            throw new BadRequestException("Occupancy is not current");
        }

        occupancy.setCurrent(false);
        occupancy.setMoveOutDate(request.moveOutDate());
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

        return toResponse(occupancy);
    }

    private Occupancy allocateBed(
            Organization organization,
            Membership membership,
            AllocateOccupancyRequest request
    ) {
        accommodationGuard.requireBedBased(organization);
        if (request.bedId() == null) {
            throw new BadRequestException("bedId is required for bed-based allocation");
        }
        if (request.unitSpaceId() != null) {
            throw new BadRequestException("unitSpaceId is not used for bed-based allocation");
        }
        Bed bed = bedService.getActiveBed(organization.getId(), request.bedId());
        return createBedOccupancy(organization, membership, bed, request.moveInDate());
    }

    private Occupancy allocateUnit(
            Organization organization,
            Membership membership,
            AllocateOccupancyRequest request
    ) {
        accommodationGuard.requireUnitBased(organization);
        if (request.unitSpaceId() == null) {
            throw new BadRequestException("unitSpaceId is required for unit-based allocation");
        }
        if (request.bedId() != null) {
            throw new BadRequestException("bedId is not used for unit-based allocation");
        }
        Space unit = spaceService.getActiveSpace(organization.getId(), request.unitSpaceId());
        return createUnitOccupancy(organization, membership, unit, request.moveInDate());
    }

    private Occupancy createBedOccupancy(
            Organization organization,
            Membership membership,
            Bed bed,
            java.time.LocalDate moveInDate
    ) {
        accommodationGuard.requireBedParentRoom(bed);
        validateAllocatableBed(bed);

        Occupancy occupancy = new Occupancy();
        occupancy.setId(UUID.randomUUID());
        occupancy.setOrganization(organization);
        occupancy.setMembership(membership);
        occupancy.setOccupancyTarget(OccupancyTarget.BED);
        occupancy.setBed(bed);
        occupancy.setMoveInDate(moveInDate);
        occupancy.setCurrent(true);
        occupancy = occupancyRepository.save(occupancy);

        statusProjectionService.markBedOccupied(bed.getId());
        return occupancy;
    }

    private Occupancy createUnitOccupancy(
            Organization organization,
            Membership membership,
            Space unit,
            java.time.LocalDate moveInDate
    ) {
        accommodationGuard.requireUnitSpace(unit);
        validateAllocatableUnit(unit);

        Occupancy occupancy = new Occupancy();
        occupancy.setId(UUID.randomUUID());
        occupancy.setOrganization(organization);
        occupancy.setMembership(membership);
        occupancy.setOccupancyTarget(OccupancyTarget.UNIT);
        occupancy.setUnitSpace(unit);
        occupancy.setMoveInDate(moveInDate);
        occupancy.setCurrent(true);
        occupancy = occupancyRepository.save(occupancy);

        statusProjectionService.recomputeUnitStatus(unit.getId());
        return occupancy;
    }

    private void validateAllocatableBed(Bed bed) {
        if (BlockStatusEvaluator.isSpaceBlocked(bed.getSpace())) {
            throw new BadRequestException("Room is blocked");
        }
        if (!BlockStatusEvaluator.isBedAllocatable(bed)) {
            throw new BadRequestException("Bed is not available for allocation");
        }
        if (occupancyRepository.existsCurrentByBedId(bed.getId())) {
            throw new ConflictException("Bed already has a current occupancy");
        }
    }

    private void validateAllocatableUnit(Space unit) {
        if (!BlockStatusEvaluator.isSpaceAllocatable(unit)) {
            throw new BadRequestException("Unit is not available for allocation");
        }
        if (occupancyRepository.existsCurrentByUnitSpaceId(unit.getId())) {
            throw new ConflictException("Unit already has a current occupancy");
        }
    }

    private Membership requireActiveMembership(UUID organizationId, UUID membershipId) {
        return membershipRepository.findActiveByIdAndOrganizationId(membershipId, organizationId)
                .orElseThrow(() -> new NotFoundException("Active membership not found"));
    }

    static OccupancyResponse toResponse(Occupancy occupancy) {
        return new OccupancyResponse(
                occupancy.getId(),
                occupancy.getMembership().getId(),
                occupancy.getMembership().getUser().getFullName(),
                occupancy.getMembership().getUser().getEmail(),
                occupancy.getOccupancyTarget(),
                occupancy.getBed() != null ? occupancy.getBed().getId() : null,
                occupancy.getBed() != null ? occupancy.getBed().getBedLabel() : null,
                occupancy.getUnitSpace() != null ? occupancy.getUnitSpace().getId() : null,
                occupancy.getUnitSpace() != null ? occupancy.getUnitSpace().getIdentifier() : null,
                occupancy.getMoveInDate(),
                occupancy.getMoveOutDate(),
                occupancy.isCurrent()
        );
    }
}
