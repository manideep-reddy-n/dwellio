package com.dwellio.accommodation.service;

import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.BedStatus;
import com.dwellio.domain.enums.SpaceStatus;

/**
 * Blocking semantics: {@code is_blocked} takes precedence over stored status values.
 * When blocked, the effective state is BLOCKED regardless of the status column.
 */
public final class BlockStatusEvaluator {

    private BlockStatusEvaluator() {
    }

    public static boolean isBedBlocked(Bed bed) {
        return bed.isBlocked();
    }

    public static boolean isSpaceBlocked(Space space) {
        return space.isBlocked();
    }

    public static boolean isBedAllocatable(Bed bed) {
        return !isBedBlocked(bed) && bed.getStatus() == BedStatus.AVAILABLE;
    }

    public static boolean isSpaceAllocatable(Space space) {
        return !isSpaceBlocked(space) && space.getStatus() == SpaceStatus.AVAILABLE;
    }

    public static void applyBedBlock(Bed bed, boolean blocked) {
        bed.setBlocked(blocked);
        if (blocked) {
            bed.setStatus(BedStatus.BLOCKED);
        }
    }

    public static void applySpaceBlock(Space space, boolean blocked) {
        space.setBlocked(blocked);
        if (blocked) {
            space.setStatus(SpaceStatus.BLOCKED);
        }
    }
}
