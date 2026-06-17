package com.dwellio.ledger.service;

import com.dwellio.ledger.dto.LedgerEntryResponse;
import com.dwellio.ledger.repository.FinancialLedgerEntryRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LedgerQueryService {

    private final FinancialLedgerEntryRepository ledgerEntryRepository;

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> listForOrganization(UUID organizationId, UUID membershipId) {
        List<com.dwellio.domain.entity.FinancialLedgerEntry> entries = membershipId != null
                ? ledgerEntryRepository.findByOrganizationAndMembership(organizationId, membershipId)
                : ledgerEntryRepository.findByOrganization(organizationId);
        return entries.stream().map(LedgerEntryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> listForMembership(UUID organizationId, UUID membershipId) {
        return ledgerEntryRepository.findByOrganizationAndMembership(organizationId, membershipId).stream()
                .map(LedgerEntryResponse::from)
                .toList();
    }
}
