package com.dwellio.marketplace.controller;

import com.dwellio.marketplace.dto.PublicOrganizationResponse;
import com.dwellio.marketplace.service.MarketplaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/marketplace/organizations")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    @GetMapping("/{slug}")
    public PublicOrganizationResponse getBySlug(@PathVariable String slug) {
        return marketplaceService.getPublicProfileBySlug(slug);
    }
}
