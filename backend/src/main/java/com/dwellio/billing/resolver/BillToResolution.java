package com.dwellio.billing.resolver;

import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.entity.UnitOwnershipRecord;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.OccupancyClassification;
import java.util.Optional;
import java.util.UUID;

public record BillToResolution(
        Membership membership,
        UUID unitSpaceId,
        String ownerNotifyEmail,
        boolean billedOnBehalfOfOwner
) {
    public static Optional<BillToResolution> empty() {
        return Optional.empty();
    }
}
