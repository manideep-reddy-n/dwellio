package com.dwellio.admin.dto;

import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminOrganizationSummary(
        UUID id,
        String slug,
        String name,
        OrganizationType type,
        HostelAudience hostelAudience,
        AccommodationMode accommodationMode,
        OrganizationStatus status,
        String city,
        String area,
        String contactPhone,
        String contactEmail,
        BigDecimal defaultMonthlyRent,
        String logoUrl,
        int activeResidentCount,
        Instant createdAt,
        Instant verifiedAt,
        String rejectionReason
) {
}
