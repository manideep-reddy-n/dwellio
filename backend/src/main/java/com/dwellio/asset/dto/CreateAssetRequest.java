package com.dwellio.asset.dto;

import com.dwellio.domain.enums.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAssetRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 100) String category,
        AssetStatus status,
        UUID buildingId,
        UUID floorId,
        UUID spaceId,
        UUID bedId,
        LocalDate purchaseDate,
        LocalDate lastMaintenanceDate,
        @Size(max = 500) String photoUrl
) {
}
