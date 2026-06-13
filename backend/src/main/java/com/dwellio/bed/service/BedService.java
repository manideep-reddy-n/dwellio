package com.dwellio.bed.service;

import com.dwellio.accommodation.event.AccommodationEventPublisher;
import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.accommodation.service.BlockStatusEvaluator;
import com.dwellio.accommodation.service.SpaceStatusProjectionService;
import com.dwellio.bed.dto.BedResponse;
import com.dwellio.bed.dto.CreateBedRequest;
import com.dwellio.bed.dto.UpdateBedRequest;
import com.dwellio.bed.repository.BedRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.BedStatus;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.space.service.SpaceService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedRepository bedRepository;
    private final SpaceService spaceService;
    private final AccommodationGuard accommodationGuard;
    private final SpaceStatusProjectionService statusProjectionService;
    private final OccupancyRepository occupancyRepository;
    private final AccommodationEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<BedResponse> listBySpace(UUID organizationId, UUID spaceId) {
        Space space = spaceService.getActiveSpace(organizationId, spaceId);
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        accommodationGuard.requireBedBased(organization);
        accommodationGuard.requireRoomSpace(space);
        return bedRepository.findAllActiveBySpaceId(spaceId).stream()
                .map(BedService::toResponse)
                .toList();
    }

    @Transactional
    public BedResponse create(UUID organizationId, UUID spaceId, CreateBedRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        accommodationGuard.requireBedBased(organization);

        Space space = spaceService.getActiveSpace(organizationId, spaceId);
        accommodationGuard.requireRoomSpace(space);

        String bedLabel = request.bedLabel().trim();
        if (bedRepository.existsActiveBySpaceIdAndBedLabel(spaceId, bedLabel)) {
            throw new ConflictException("Bed label already exists in this room");
        }

        Bed bed = new Bed();
        bed.setId(UUID.randomUUID());
        bed.setSpace(space);
        bed.setOrganization(organization);
        bed.setBedLabel(bedLabel);
        bed.setStatus(BedStatus.AVAILABLE);
        bed.setBlocked(false);
        bed = bedRepository.save(bed);

        statusProjectionService.syncRoomCapacity(spaceId);
        statusProjectionService.recomputeRoomStatus(spaceId);
        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(bed);
    }

    @Transactional
    public BedResponse update(UUID organizationId, UUID bedId, UpdateBedRequest request) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        accommodationGuard.requireBedBased(organization);

        Bed bed = getActiveBed(organizationId, bedId);
        accommodationGuard.requireBedParentRoom(bed);

        if (request.bedLabel() != null && !request.bedLabel().trim().equals(bed.getBedLabel())) {
            String bedLabel = request.bedLabel().trim();
            if (bedRepository.existsActiveBySpaceIdAndBedLabel(bed.getSpace().getId(), bedLabel)) {
                throw new ConflictException("Bed label already exists in this room");
            }
            bed.setBedLabel(bedLabel);
        }
        if (request.blocked() != null) {
            BlockStatusEvaluator.applyBedBlock(bed, request.blocked());
            if (!request.blocked() && !occupancyRepository.existsCurrentByBedId(bedId)) {
                bed.setStatus(BedStatus.AVAILABLE);
            }
            statusProjectionService.recomputeRoomStatus(bed.getSpace().getId());
        }

        eventPublisher.publishStructureChanged(organizationId);
        return toResponse(bed);
    }

    @Transactional
    public void delete(UUID organizationId, UUID bedId) {
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        accommodationGuard.requireBedBased(organization);

        Bed bed = getActiveBed(organizationId, bedId);
        accommodationGuard.requireBedParentRoom(bed);

        if (occupancyRepository.existsCurrentByBedId(bedId)) {
            throw new BadRequestException("Cannot delete a bed with a current occupancy");
        }

        UUID spaceId = bed.getSpace().getId();
        bed.setDeletedAt(Instant.now(clock));
        bedRepository.save(bed);

        statusProjectionService.syncRoomCapacity(spaceId);
        statusProjectionService.recomputeRoomStatus(spaceId);
        eventPublisher.publishStructureChanged(organizationId);
    }

    public Bed getActiveBed(UUID organizationId, UUID bedId) {
        return bedRepository.findActiveByIdAndOrganizationId(bedId, organizationId)
                .orElseThrow(() -> new NotFoundException("Bed not found"));
    }

    static BedResponse toResponse(Bed bed) {
        return new BedResponse(
                bed.getId(),
                bed.getSpace().getId(),
                bed.getBedLabel(),
                bed.getStatus(),
                bed.isBlocked()
        );
    }
}
