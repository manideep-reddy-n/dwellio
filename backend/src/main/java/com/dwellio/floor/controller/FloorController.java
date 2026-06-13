package com.dwellio.floor.controller;

import com.dwellio.floor.dto.CreateFloorRequest;
import com.dwellio.floor.dto.FloorResponse;
import com.dwellio.floor.dto.UpdateFloorRequest;
import com.dwellio.floor.service.FloorService;
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
@RequiredArgsConstructor
public class FloorController {

    private final FloorService floorService;

    @GetMapping("/organizations/{organizationId}/buildings/{buildingId}/floors")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public List<FloorResponse> listByBuilding(
            @PathVariable UUID organizationId,
            @PathVariable UUID buildingId
    ) {
        return floorService.listByBuilding(organizationId, buildingId);
    }

    @GetMapping("/organizations/{organizationId}/floors/{floorId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public FloorResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID floorId
    ) {
        return floorService.get(organizationId, floorId);
    }

    @PostMapping("/organizations/{organizationId}/buildings/{buildingId}/floors")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public FloorResponse create(
            @PathVariable UUID organizationId,
            @PathVariable UUID buildingId,
            @Valid @RequestBody CreateFloorRequest request
    ) {
        return floorService.create(organizationId, buildingId, request);
    }

    @PatchMapping("/organizations/{organizationId}/floors/{floorId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public FloorResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID floorId,
            @Valid @RequestBody UpdateFloorRequest request
    ) {
        return floorService.update(organizationId, floorId, request);
    }

    @DeleteMapping("/organizations/{organizationId}/floors/{floorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID floorId
    ) {
        floorService.delete(organizationId, floorId);
    }
}
