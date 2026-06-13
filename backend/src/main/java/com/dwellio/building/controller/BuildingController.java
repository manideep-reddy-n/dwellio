package com.dwellio.building.controller;

import com.dwellio.building.dto.BuildingResponse;
import com.dwellio.building.dto.CreateBuildingRequest;
import com.dwellio.building.dto.UpdateBuildingRequest;
import com.dwellio.building.service.BuildingService;
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
@RequestMapping("/organizations/{organizationId}/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public List<BuildingResponse> list(@PathVariable UUID organizationId) {
        return buildingService.list(organizationId);
    }

    @GetMapping("/{buildingId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public BuildingResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID buildingId
    ) {
        return buildingService.get(organizationId, buildingId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public BuildingResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateBuildingRequest request
    ) {
        return buildingService.create(organizationId, request);
    }

    @PatchMapping("/{buildingId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public BuildingResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID buildingId,
            @Valid @RequestBody UpdateBuildingRequest request
    ) {
        return buildingService.update(organizationId, buildingId, request);
    }

    @DeleteMapping("/{buildingId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID buildingId
    ) {
        buildingService.delete(organizationId, buildingId);
    }
}
