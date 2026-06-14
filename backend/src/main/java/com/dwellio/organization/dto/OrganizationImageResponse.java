package com.dwellio.organization.dto;

import java.util.UUID;

public record OrganizationImageResponse(
        UUID id,
        String url,
        String caption,
        int sortOrder
) {
}
