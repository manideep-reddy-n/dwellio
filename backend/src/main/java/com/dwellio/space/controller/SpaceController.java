package com.dwellio.space.controller;

import com.dwellio.space.dto.CreateSpaceRequest;
import com.dwellio.space.dto.SpaceResponse;
import com.dwellio.space.dto.UpdateSpaceRequest;
import com.dwellio.space.service.SpaceService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    @GetMapping("/organizations/{organizationId}/floors/{floorId}/spaces")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public List<SpaceResponse> listByFloor(
            @PathVariable UUID organizationId,
            @PathVariable UUID floorId
    ) {
        return spaceService.listByFloor(organizationId, floorId);
    }

    @GetMapping("/organizations/{organizationId}/spaces/{spaceId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public SpaceResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID spaceId
    ) {
        return spaceService.get(organizationId, spaceId);
    }

    @PostMapping("/organizations/{organizationId}/floors/{floorId}/spaces")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public SpaceResponse create(
            @PathVariable UUID organizationId,
            @PathVariable UUID floorId,
            @Valid @RequestBody CreateSpaceRequest request
    ) {
        return spaceService.create(organizationId, floorId, request);
    }

    @PatchMapping("/organizations/{organizationId}/spaces/{spaceId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public SpaceResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID spaceId,
            @Valid @RequestBody UpdateSpaceRequest request
    ) {
        return spaceService.update(organizationId, spaceId, request);
    }

    @DeleteMapping("/organizations/{organizationId}/spaces/{spaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID spaceId
    ) {
        spaceService.delete(organizationId, spaceId);
    }
}
