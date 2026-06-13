package com.dwellio.bed.dto;

import com.dwellio.domain.enums.BedStatus;
import java.util.UUID;

public record BedResponse(
        UUID id,
        UUID spaceId,
        String bedLabel,
        BedStatus status,
        boolean blocked
) {
}
