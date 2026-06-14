package com.dwellio.occupancy.dto;

import com.dwellio.domain.enums.OccupancyTarget;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record OccupancyResponse(
        UUID id,
        UUID membershipId,
        String residentName,
        String residentEmail,
        OccupancyTarget occupancyTarget,
        UUID bedId,
        String bedLabel,
        UUID unitSpaceId,
        String unitIdentifier,
        LocalDate moveInDate,
        LocalDate moveOutDate,
        boolean current,
        BigDecimal monthlyRent
) {
}
