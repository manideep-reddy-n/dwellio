package com.dwellio.billing.resolver;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Occupancy;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Space;
import com.dwellio.domain.entity.UnitOwnershipRecord;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.OccupancyClassification;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.occupancy.repository.OccupancyRepository;
import com.dwellio.ownership.repository.UnitOwnershipRecordRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BillToResolver {

    private final UnitOwnershipRecordRepository ownershipRecordRepository;
    private final OccupancyRepository occupancyRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public Optional<BillToResolution> resolveForUnit(
            Organization organization,
            Space unit,
            BillingRule rule,
            LocalDate asOf
    ) {
        UnitOwnershipRecord ownership = findEffectiveOwnership(organization.getId(), unit.getId(), asOf).orElse(null);
        Occupancy occupancy = occupancyRepository
                .findCurrentOccupancyByUnitSpaceId(organization.getId(), unit.getId())
                .orElse(null);

        BillingResponsibility responsibility = resolveResponsibility(rule, ownership, occupancy);
        return resolveMembership(organization, unit, ownership, occupancy, responsibility);
    }

    private BillingResponsibility resolveResponsibility(
            BillingRule rule,
            UnitOwnershipRecord ownership,
            Occupancy occupancy
    ) {
        if (ownership != null) {
            return ownership.getBillingResponsibility();
        }
        if (occupancy != null && occupancy.getOccupancyClassification() != null) {
            return switch (occupancy.getOccupancyClassification()) {
                case OWNER_OCCUPIED -> BillingResponsibility.OWNER;
                case TENANT_OCCUPIED -> BillingResponsibility.TENANT;
                case RESIDENT, VACANT -> BillingResponsibility.RESIDENT;
            };
        }
        return rule.getBillTo();
    }

    private Optional<BillToResolution> resolveMembership(
            Organization organization,
            Space unit,
            UnitOwnershipRecord ownership,
            Occupancy occupancy,
            BillingResponsibility responsibility
    ) {
        return switch (responsibility) {
            case OWNER -> resolveOwnerBilling(organization, unit, ownership, occupancy);
            case TENANT, RESIDENT -> resolveOccupantBilling(unit, occupancy);
        };
    }

    private Optional<BillToResolution> resolveOwnerBilling(
            Organization organization,
            Space unit,
            UnitOwnershipRecord ownership,
            Occupancy occupancy
    ) {
        String ownerEmail = ownership != null ? ownership.getOwnerEmail() : null;
        if (ownerEmail != null && !ownerEmail.isBlank()) {
            Optional<Membership> ownerMembership = userRepository.findActiveByEmail(ownerEmail.trim())
                    .flatMap(user -> membershipRepository.findActiveByUserIdAndOrganizationId(
                            user.getId(), organization.getId()));
            if (ownerMembership.isPresent()) {
                return Optional.of(new BillToResolution(
                        ownerMembership.get(),
                        unit.getId(),
                        ownerEmail,
                        false
                ));
            }
        }

        if (occupancy == null) {
            return Optional.empty();
        }

        return Optional.of(new BillToResolution(
                occupancy.getMembership(),
                unit.getId(),
                ownerEmail,
                ownerEmail != null && !ownerEmail.isBlank()
        ));
    }

    private Optional<BillToResolution> resolveOccupantBilling(Space unit, Occupancy occupancy) {
        if (occupancy == null) {
            return Optional.empty();
        }
        return Optional.of(new BillToResolution(
                occupancy.getMembership(),
                unit.getId(),
                null,
                false
        ));
    }

    private Optional<UnitOwnershipRecord> findEffectiveOwnership(
            UUID organizationId,
            UUID unitSpaceId,
            LocalDate asOf
    ) {
        List<UnitOwnershipRecord> records = ownershipRecordRepository.findByOrganizationAndUnit(
                organizationId,
                unitSpaceId
        );
        return records.stream()
                .filter(record -> !record.getEffectiveFrom().isAfter(asOf))
                .filter(record -> record.getEffectiveTo() == null || !record.getEffectiveTo().isBefore(asOf))
                .max(Comparator.comparing(UnitOwnershipRecord::getEffectiveFrom));
    }
}
