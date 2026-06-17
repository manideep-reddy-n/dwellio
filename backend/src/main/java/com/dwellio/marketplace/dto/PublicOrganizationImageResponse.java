package com.dwellio.marketplace.dto;

import com.dwellio.domain.entity.OrganizationImage;
import java.util.UUID;

public record PublicOrganizationImageResponse(
        UUID id,
        String url,
        String caption,
        int sortOrder
) {
    public static PublicOrganizationImageResponse from(OrganizationImage image) {
        return new PublicOrganizationImageResponse(
                image.getId(),
                image.getUrl(),
                image.getCaption(),
                image.getSortOrder()
        );
    }
}
