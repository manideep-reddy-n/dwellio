package com.dwellio.asset.dto;

import com.dwellio.domain.entity.Asset;
import com.dwellio.domain.enums.AssetStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AssetResponse(
        UUID id,
        UUID organizationId,
        String name,
        String category,
        AssetStatus status,
        UUID buildingId,
        UUID floorId,
        UUID spaceId,
        UUID bedId,
        LocalDate purchaseDate,
        LocalDate lastMaintenanceDate,
        String photoUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static AssetResponse from(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getOrganization().getId(),
                asset.getName(),
                asset.getCategory(),
                asset.getStatus(),
                asset.getBuilding() != null ? asset.getBuilding().getId() : null,
                asset.getFloor() != null ? asset.getFloor().getId() : null,
                asset.getSpace() != null ? asset.getSpace().getId() : null,
                asset.getBed() != null ? asset.getBed().getId() : null,
                asset.getPurchaseDate(),
                asset.getLastMaintenanceDate(),
                asset.getPhotoUrl(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }
}
