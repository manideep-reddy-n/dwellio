package com.dwellio.ownership.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.entity.UnitOwnershipRecord;
import com.dwellio.ownership.dto.CreateOwnershipRecordRequest;
import com.dwellio.ownership.dto.OwnershipRecordResponse;
import com.dwellio.ownership.repository.UnitOwnershipRecordRepository;
import com.dwellio.space.repository.SpaceRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnershipService {

    private final UnitOwnershipRecordRepository ownershipRecordRepository;
    private final SpaceRepository spaceRepository;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;

    @Transactional(readOnly = true)
    public List<OwnershipRecordResponse> list(UUID organizationId, UUID unitSpaceId) {
        authorizationService.requirePermission(organizationId, "building:manage");
        accommodationGuard.requireOrganization(organizationId);
        List<UnitOwnershipRecord> records = unitSpaceId != null
                ? ownershipRecordRepository.findByOrganizationAndUnit(organizationId, unitSpaceId)
                : ownershipRecordRepository.findAllByOrganizationId(organizationId);
        return records.stream().map(OwnershipRecordResponse::from).toList();
    }

    @Transactional
    public OwnershipRecordResponse create(UUID organizationId, CreateOwnershipRecordRequest request) {
        authorizationService.requirePermission(organizationId, "building:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        Space unit = spaceRepository.findActiveByIdAndOrganizationId(request.unitSpaceId(), organizationId)
                .orElseThrow(() -> new NotFoundException("Unit not found"));

        UnitOwnershipRecord record = new UnitOwnershipRecord();
        record.setId(UUID.randomUUID());
        record.setOrganization(organization);
        record.setUnitSpace(unit);
        record.setOwnerName(request.ownerName());
        record.setOwnerEmail(request.ownerEmail());
        record.setOwnerPhone(request.ownerPhone());
        record.setBillingResponsibility(request.billingResponsibility());
        record.setEffectiveFrom(request.effectiveFrom());
        record.setEffectiveTo(request.effectiveTo());
        record.setNotes(request.notes());
        return OwnershipRecordResponse.from(ownershipRecordRepository.save(record));
    }
}
