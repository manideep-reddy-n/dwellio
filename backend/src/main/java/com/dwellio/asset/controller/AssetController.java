package com.dwellio.asset.controller;

import com.dwellio.asset.dto.AssetResponse;
import com.dwellio.asset.dto.CreateAssetRequest;
import com.dwellio.asset.dto.UpdateAssetRequest;
import com.dwellio.asset.service.AssetService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'asset:read')")
    public List<AssetResponse> list(@PathVariable UUID organizationId) {
        return assetService.list(organizationId);
    }

    @GetMapping("/{assetId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'asset:read')")
    public AssetResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID assetId
    ) {
        return assetService.get(organizationId, assetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'asset:manage')")
    public AssetResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateAssetRequest request
    ) {
        return assetService.create(organizationId, request);
    }

    @PatchMapping("/{assetId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'asset:manage')")
    public AssetResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID assetId,
            @Valid @RequestBody UpdateAssetRequest request
    ) {
        return assetService.update(organizationId, assetId, request);
    }

    @DeleteMapping("/{assetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'asset:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID assetId
    ) {
        assetService.delete(organizationId, assetId);
    }
}
