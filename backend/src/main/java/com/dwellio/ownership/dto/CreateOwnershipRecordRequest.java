package com.dwellio.ownership.dto;

import com.dwellio.domain.enums.BillingResponsibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateOwnershipRecordRequest(
        @NotNull UUID unitSpaceId,
        @NotBlank String ownerName,
        String ownerEmail,
        String ownerPhone,
        @NotNull BillingResponsibility billingResponsibility,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String notes
) {
}
