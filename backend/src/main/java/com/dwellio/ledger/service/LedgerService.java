package com.dwellio.ledger.service;

import com.dwellio.domain.entity.FinancialLedgerEntry;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.LedgerEntryType;
import com.dwellio.ledger.repository.FinancialLedgerEntryRepository;
import com.dwellio.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final FinancialLedgerEntryRepository ledgerEntryRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public void recordChargeGenerated(Payment payment, User createdBy) {
        if (ledgerEntryRepository.existsByPaymentIdAndEntryType(payment.getId(), LedgerEntryType.CHARGE_GENERATED)) {
            return;
        }
        BigDecimal signedAmount = payment.getAmount().setScale(2, RoundingMode.HALF_UP);
        appendEntry(payment, LedgerEntryType.CHARGE_GENERATED, signedAmount, chargeDescription(payment), createdBy);
    }

    @Transactional
    public void recordPaymentReceived(Payment payment, BigDecimal previousPaid, User createdBy) {
        BigDecimal currentPaid = payment.getAmountPaid().setScale(2, RoundingMode.HALF_UP);
        BigDecimal previous = previousPaid != null ? previousPaid.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal delta = currentPaid.subtract(previous);
        if (delta.signum() <= 0) {
            return;
        }
        BigDecimal signedAmount = delta.negate();
        appendEntry(
                payment,
                LedgerEntryType.PAYMENT_RECEIVED,
                signedAmount,
                "Payment recorded — ₹" + delta,
                createdBy
        );
    }

    @Transactional
    public void backfillOrganization(UUID organizationId) {
        for (Payment payment : paymentRepository.findAllActiveByOrganizationId(organizationId)) {
            if (!ledgerEntryRepository.existsByPaymentIdAndEntryType(payment.getId(), LedgerEntryType.CHARGE_GENERATED)) {
                recordChargeGenerated(payment, null);
            }
            if (payment.getAmountPaid().signum() > 0 && !ledgerEntryRepository.hasPaymentReceivedEntry(payment.getId())) {
                Payment snapshot = payment;
                BigDecimal paid = snapshot.getAmountPaid();
                snapshot.setAmountPaid(BigDecimal.ZERO);
                recordPaymentReceived(snapshot, BigDecimal.ZERO, snapshot.getRecordedBy());
                snapshot.setAmountPaid(paid);
            }
        }
    }

    private void appendEntry(
            Payment payment,
            LedgerEntryType entryType,
            BigDecimal signedAmount,
            String description,
            User createdBy
    ) {
        Organization organization = payment.getOrganization();
        Membership membership = payment.getMembership();
        BigDecimal previousBalance = ledgerEntryRepository
                .findLatestBalance(organization.getId(), membership.getId())
                .orElse(BigDecimal.ZERO);
        BigDecimal balanceAfter = previousBalance.add(signedAmount).setScale(2, RoundingMode.HALF_UP);

        FinancialLedgerEntry entry = new FinancialLedgerEntry();
        entry.setId(UUID.randomUUID());
        entry.setOrganization(organization);
        entry.setMembership(membership);
        entry.setPayment(payment);
        entry.setEntryType(entryType);
        entry.setAmount(signedAmount.abs());
        entry.setBalanceAfter(balanceAfter);
        entry.setDescription(description);
        entry.setReferenceMonth(payment.getBillingMonth());
        entry.setCreatedBy(createdBy);
        ledgerEntryRepository.save(entry);
    }

    private String chargeDescription(Payment payment) {
        if (payment.getDescription() != null && !payment.getDescription().isBlank()) {
            return payment.getDescription();
        }
        return payment.getChargeType().name() + " charge";
    }
}
