package com.dwellio.ownership.dto;

import com.dwellio.domain.entity.UnitOwnershipRecord;
import com.dwellio.domain.enums.BillingResponsibility;
import java.time.LocalDate;
import java.util.UUID;

public record OwnershipRecordResponse(
        UUID id,
        UUID unitSpaceId,
        String unitIdentifier,
        String ownerName,
        String ownerEmail,
        String ownerPhone,
        BillingResponsibility billingResponsibility,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String notes
) {
    public static OwnershipRecordResponse from(UnitOwnershipRecord record) {
        return new OwnershipRecordResponse(
                record.getId(),
                record.getUnitSpace().getId(),
                record.getUnitSpace().getIdentifier(),
                record.getOwnerName(),
                record.getOwnerEmail(),
                record.getOwnerPhone(),
                record.getBillingResponsibility(),
                record.getEffectiveFrom(),
                record.getEffectiveTo(),
                record.getNotes()
        );
    }
}
