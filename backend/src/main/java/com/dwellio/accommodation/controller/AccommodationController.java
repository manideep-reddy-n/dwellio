package com.dwellio.accommodation.controller;

import com.dwellio.accommodation.dto.AccommodationVisualizationResponse;
import com.dwellio.accommodation.dto.UpdateAccommodationLayoutRequest;
import com.dwellio.accommodation.service.AccommodationLayoutService;
import com.dwellio.accommodation.service.AccommodationVisualizationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/accommodation")
@RequiredArgsConstructor
public class AccommodationController {

    private final AccommodationVisualizationService visualizationService;
    private final AccommodationLayoutService layoutService;

    @GetMapping("/visualization")
    @PreAuthorize("@authz.canViewAccommodationVisualization(#organizationId)")
    public AccommodationVisualizationResponse visualization(@PathVariable UUID organizationId) {
        return visualizationService.getVisualization(organizationId);
    }

    @PatchMapping("/layout")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLayout(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateAccommodationLayoutRequest request
    ) {
        layoutService.updateLayout(organizationId, request);
    }
}
