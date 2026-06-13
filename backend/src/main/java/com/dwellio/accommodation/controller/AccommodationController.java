package com.dwellio.accommodation.controller;

import com.dwellio.accommodation.dto.AccommodationVisualizationResponse;
import com.dwellio.accommodation.service.AccommodationVisualizationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/accommodation")
@RequiredArgsConstructor
public class AccommodationController {

    private final AccommodationVisualizationService visualizationService;

    @GetMapping("/visualization")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public AccommodationVisualizationResponse visualization(@PathVariable UUID organizationId) {
        return visualizationService.getVisualization(organizationId);
    }
}
