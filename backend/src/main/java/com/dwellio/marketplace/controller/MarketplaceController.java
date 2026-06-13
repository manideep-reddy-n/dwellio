package com.dwellio.marketplace.controller;

import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.marketplace.dto.PublicOrganizationResponse;
import com.dwellio.marketplace.dto.PublicOrganizationSummaryResponse;
import com.dwellio.marketplace.dto.PublicReviewResponse;
import com.dwellio.marketplace.service.MarketplaceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/marketplace/organizations")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    @GetMapping
    public List<PublicOrganizationSummaryResponse> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) OrganizationType type,
            @RequestParam(required = false, name = "q") String query
    ) {
        return marketplaceService.search(city, type, query);
    }

    @GetMapping("/{slug}")
    public PublicOrganizationResponse getBySlug(@PathVariable String slug) {
        return marketplaceService.getPublicProfileBySlug(slug);
    }

    @GetMapping("/{slug}/reviews")
    public List<PublicReviewResponse> listReviews(@PathVariable String slug) {
        return marketplaceService.listPublicReviewsBySlug(slug);
    }
}
