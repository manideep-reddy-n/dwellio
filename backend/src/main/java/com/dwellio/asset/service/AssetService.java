package com.dwellio.asset.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.asset.dto.AssetResponse;
import com.dwellio.asset.dto.CreateAssetRequest;
import com.dwellio.asset.dto.UpdateAssetRequest;
import com.dwellio.asset.repository.AssetRepository;
import com.dwellio.bed.repository.BedRepository;
import com.dwellio.building.repository.BuildingRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.Asset;
import com.dwellio.domain.entity.Bed;
import com.dwellio.domain.entity.Building;
import com.dwellio.domain.entity.Floor;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.enums.AssetStatus;
import com.dwellio.floor.repository.FloorRepository;
import com.dwellio.operations.service.OperationsGuard;
import com.dwellio.space.repository.SpaceRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final BedRepository bedRepository;
    private final OperationsGuard operationsGuard;
    private final AccommodationGuard accommodationGuard;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<AssetResponse> list(UUID organizationId) {
        operationsGuard.requireOrganization(organizationId);
        return assetRepository.findAllActiveByOrganizationId(organizationId).stream()
                .map(AssetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse get(UUID organizationId, UUID assetId) {
        return AssetResponse.from(getActiveAsset(organizationId, assetId));
    }

    @Transactional
    public AssetResponse create(UUID organizationId, CreateAssetRequest request) {
        Organization organization = operationsGuard.requireOrganization(organizationId);

        Asset asset = new Asset();
        asset.setId(UUID.randomUUID());
        asset.setOrganization(organization);
        asset.setName(request.name().trim());
        asset.setCategory(request.category().trim());
        asset.setStatus(request.status() != null ? request.status() : AssetStatus.WORKING);
        applyLocation(organizationId, asset, request.buildingId(), request.floorId(), request.spaceId(), request.bedId());
        asset.setPurchaseDate(request.purchaseDate());
        asset.setLastMaintenanceDate(request.lastMaintenanceDate());
        asset.setPhotoUrl(request.photoUrl());
        return AssetResponse.from(assetRepository.save(asset));
    }

    @Transactional
    public AssetResponse update(UUID organizationId, UUID assetId, UpdateAssetRequest request) {
        Asset asset = getActiveAsset(organizationId, assetId);

        if (request.name() != null) {
            asset.setName(request.name().trim());
        }
        if (request.category() != null) {
            asset.setCategory(request.category().trim());
        }
        if (request.status() != null) {
            asset.setStatus(request.status());
        }
        if (request.buildingId() != null || request.floorId() != null
                || request.spaceId() != null || request.bedId() != null) {
            applyLocation(
                    organizationId,
                    asset,
                    request.buildingId(),
                    request.floorId(),
                    request.spaceId(),
                    request.bedId()
            );
        }
        if (request.purchaseDate() != null) {
            asset.setPurchaseDate(request.purchaseDate());
        }
        if (request.lastMaintenanceDate() != null) {
            asset.setLastMaintenanceDate(request.lastMaintenanceDate());
        }
        if (request.photoUrl() != null) {
            asset.setPhotoUrl(request.photoUrl());
        }

        return AssetResponse.from(asset);
    }

    @Transactional
    public void delete(UUID organizationId, UUID assetId) {
        Asset asset = getActiveAsset(organizationId, assetId);
        asset.setDeletedAt(Instant.now(clock));
    }

    private Asset getActiveAsset(UUID organizationId, UUID assetId) {
        operationsGuard.requireOrganization(organizationId);
        return assetRepository.findActiveByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new NotFoundException("Asset not found"));
    }

    private void applyLocation(
            UUID organizationId,
            Asset asset,
            UUID buildingId,
            UUID floorId,
            UUID spaceId,
            UUID bedId
    ) {
        Building building = buildingId != null
                ? buildingRepository.findActiveByIdAndOrganizationId(buildingId, organizationId)
                .orElseThrow(() -> new NotFoundException("Building not found"))
                : null;
        Floor floor = floorId != null
                ? floorRepository.findActiveByIdAndOrganizationId(floorId, organizationId)
                .orElseThrow(() -> new NotFoundException("Floor not found"))
                : null;
        Space space = spaceId != null
                ? spaceRepository.findActiveByIdAndOrganizationId(spaceId, organizationId)
                .orElseThrow(() -> new NotFoundException("Space not found"))
                : null;
        Bed bed = bedId != null
                ? bedRepository.findActiveByIdAndOrganizationId(bedId, organizationId)
                .orElseThrow(() -> new NotFoundException("Bed not found"))
                : null;

        if (building != null) {
            accommodationGuard.requireSameOrganization(organizationId, building.getOrganization().getId());
        }
        if (floor != null) {
            accommodationGuard.requireSameOrganization(organizationId, floor.getOrganization().getId());
        }
        if (space != null) {
            accommodationGuard.requireSameOrganization(organizationId, space.getOrganization().getId());
        }
        if (bed != null) {
            accommodationGuard.requireSameOrganization(organizationId, bed.getOrganization().getId());
        }

        asset.setBuilding(building);
        asset.setFloor(floor);
        asset.setSpace(space);
        asset.setBed(bed);
    }
}
