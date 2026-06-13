package com.dwellio.accommodation.service;

import com.dwellio.bed.repository.BedRepository;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.BedStatus;
import com.dwellio.domain.enums.SpaceStatus;
import com.dwellio.domain.enums.SpaceType;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.space.repository.SpaceRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpaceStatusProjectionService {

    private final BedRepository bedRepository;
    private final SpaceRepository spaceRepository;
    private final OccupancyRepository occupancyRepository;

    @Transactional
    public void syncRoomCapacity(UUID spaceId) {
        Space space = spaceRepository.findActiveById(spaceId)
                .orElseThrow();
        if (space.getSpaceType() != SpaceType.ROOM) {
            return;
        }
        int bedCount = bedRepository.countActiveBySpaceId(spaceId);
        space.setCapacity(bedCount);
        spaceRepository.save(space);
    }

    @Transactional
    public void recomputeRoomStatus(UUID spaceId) {
        Space space = spaceRepository.findActiveById(spaceId)
                .orElseThrow();
        if (space.getSpaceType() != SpaceType.ROOM) {
            return;
        }
        if (BlockStatusEvaluator.isSpaceBlocked(space)) {
            space.setStatus(SpaceStatus.BLOCKED);
            spaceRepository.save(space);
            return;
        }

        List<Bed> beds = bedRepository.findAllActiveBySpaceId(spaceId);
        if (beds.isEmpty()) {
            space.setStatus(SpaceStatus.AVAILABLE);
            spaceRepository.save(space);
            return;
        }

        int blocked = 0;
        int occupied = 0;
        int available = 0;
        for (Bed bed : beds) {
            if (BlockStatusEvaluator.isBedBlocked(bed)) {
                blocked++;
            } else if (bed.getStatus() == BedStatus.OCCUPIED) {
                occupied++;
            } else {
                available++;
            }
        }

        SpaceStatus status;
        if (blocked == beds.size()) {
            status = SpaceStatus.BLOCKED;
        } else if (occupied == beds.size()) {
            status = SpaceStatus.OCCUPIED;
        } else if (occupied > 0 && available > 0) {
            status = SpaceStatus.PARTIALLY_OCCUPIED;
        } else if (occupied > 0) {
            status = SpaceStatus.OCCUPIED;
        } else {
            status = SpaceStatus.AVAILABLE;
        }

        space.setStatus(status);
        spaceRepository.save(space);
    }

    @Transactional
    public void recomputeUnitStatus(UUID spaceId) {
        Space space = spaceRepository.findActiveById(spaceId)
                .orElseThrow();
        if (space.getSpaceType() != SpaceType.UNIT) {
            return;
        }
        if (BlockStatusEvaluator.isSpaceBlocked(space)) {
            space.setStatus(SpaceStatus.BLOCKED);
            spaceRepository.save(space);
            return;
        }

        boolean occupied = occupancyRepository.existsCurrentByUnitSpaceId(spaceId);
        space.setStatus(occupied ? SpaceStatus.OCCUPIED : SpaceStatus.AVAILABLE);
        spaceRepository.save(space);
    }

    @Transactional
    public void markBedOccupied(UUID bedId) {
        Bed bed = bedRepository.findActiveById(bedId).orElseThrow();
        if (!BlockStatusEvaluator.isBedBlocked(bed)) {
            bed.setStatus(BedStatus.OCCUPIED);
            bedRepository.save(bed);
        }
        recomputeRoomStatus(bed.getSpace().getId());
    }

    @Transactional
    public void markBedAvailable(UUID bedId) {
        Bed bed = bedRepository.findActiveById(bedId).orElseThrow();
        if (!BlockStatusEvaluator.isBedBlocked(bed)) {
            bed.setStatus(BedStatus.AVAILABLE);
            bedRepository.save(bed);
        }
        recomputeRoomStatus(bed.getSpace().getId());
    }
}
