package com.dwellio.organization.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateOrganizationRequest(
        @Size(max = 255) String name,
        @Size(max = 5000) String description,
        @Size(max = 100) String city,
        @Size(max = 100) String area,
        @Size(max = 100) String state,
        @Size(max = 20) String postalCode,
        @Size(max = 500) String addressLine,
        BigDecimal latitude,
        BigDecimal longitude,
        @Size(max = 50) String contactPhone,
        @Size(max = 255) String contactEmail,
        @DecimalMin("0.00") BigDecimal defaultMonthlyRent
) {
}
