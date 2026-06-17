package com.dwellio.organization.dto;

import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.BillingMode;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import java.math.BigDecimal;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String slug,
        String name,
        String description,
        OrganizationType type,
        HostelAudience hostelAudience,
        AccommodationMode accommodationMode,
        OrganizationStatus status,
        String city,
        String area,
        String state,
        String postalCode,
        String addressLine,
        BigDecimal latitude,
        BigDecimal longitude,
        String contactPhone,
        String contactEmail,
        String planCode,
        BigDecimal defaultMonthlyRent,
        String logoUrl,
        BigDecimal slaFirstResponseHours,
        BigDecimal slaResolutionHours,
        BillingMode billingMode,
        Short billingCustomDay
) {
}
