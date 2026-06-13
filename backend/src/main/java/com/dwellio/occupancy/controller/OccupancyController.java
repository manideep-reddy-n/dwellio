package com.dwellio.occupancy.controller;

import com.dwellio.occupancy.dto.AllocateOccupancyRequest;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.occupancy.dto.ReleaseOccupancyRequest;
import com.dwellio.occupancy.dto.TransferOccupancyRequest;
import com.dwellio.occupancy.service.OccupancyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/occupancies")
@RequiredArgsConstructor
public class OccupancyController {

    private final OccupancyService occupancyService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public List<OccupancyResponse> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) UUID membershipId
    ) {
        return occupancyService.list(organizationId, membershipId);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'allocation:read_own')")
    public OccupancyResponse getMine(@PathVariable UUID organizationId) {
        return occupancyService.getMine(organizationId);
    }

    @PostMapping("/allocate")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public OccupancyResponse allocate(
            @PathVariable UUID organizationId,
            @Valid @RequestBody AllocateOccupancyRequest request
    ) {
        return occupancyService.allocate(organizationId, request);
    }

    @PostMapping("/transfer")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public OccupancyResponse transfer(
            @PathVariable UUID organizationId,
            @Valid @RequestBody TransferOccupancyRequest request
    ) {
        return occupancyService.transfer(organizationId, request);
    }

    @PostMapping("/{occupancyId}/release")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public OccupancyResponse release(
            @PathVariable UUID organizationId,
            @PathVariable UUID occupancyId,
            @Valid @RequestBody ReleaseOccupancyRequest request
    ) {
        return occupancyService.release(organizationId, occupancyId, request);
    }
}
