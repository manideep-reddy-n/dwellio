package com.dwellio.organization.dto;

import com.dwellio.domain.enums.OrganizationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrganizationRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be lowercase alphanumeric with hyphens")
        @Size(max = 100) String slug,
        @NotNull OrganizationType type,
        @Size(max = 5000) String description,
        @NotBlank @Size(max = 100) String city,
        @Size(max = 100) String area,
        @Size(max = 100) String state,
        @Size(max = 20) String postalCode,
        @Size(max = 500) String addressLine,
        @Size(max = 50) String contactPhone,
        @Size(max = 255) String contactEmail
) {
}
