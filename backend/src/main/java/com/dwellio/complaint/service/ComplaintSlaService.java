package com.dwellio.complaint.service;

import com.dwellio.complaint.dto.ComplaintSlaBreachItemResponse;
import com.dwellio.complaint.dto.ComplaintSlaSummaryResponse;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.complaint.sla.ComplaintSlaBreachType;
import com.dwellio.complaint.sla.ComplaintSlaEvaluator;
import com.dwellio.complaint.sla.ComplaintSlaSettings;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.Organization;
import com.dwellio.metrics.projection.MetricsAggregateRepository;
import com.dwellio.metrics.projection.snapshot.SlaMetricsSnapshot;
import com.dwellio.operations.service.OperationsGuard;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComplaintSlaService {

    private final ComplaintRepository complaintRepository;
    private final OperationsGuard operationsGuard;
    private final ComplaintSlaEvaluator slaEvaluator;
    private final MetricsAggregateRepository metricsAggregateRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public ComplaintSlaSummaryResponse getSummary(UUID organizationId) {
        Organization organization = operationsGuard.requireOrganization(organizationId);
        ComplaintSlaSettings settings = ComplaintSlaSettings.from(organization);
        Instant now = Instant.now(clock);

        List<Complaint> complaints = complaintRepository.findAllActiveByOrganizationId(organizationId, null);
        List<ComplaintSlaBreachItemResponse> breached = complaints.stream()
                .map(complaint -> toBreachItem(complaint, settings, now))
                .filter(item -> !item.breachTypes().isEmpty())
                .sorted(Comparator.comparing(ComplaintSlaBreachItemResponse::createdAt).reversed())
                .toList();

        SlaMetricsSnapshot metrics = metricsAggregateRepository.aggregateSlaMetrics(
                organizationId,
                settings.firstResponseHours(),
                settings.resolutionHours(),
                now
        );

        return new ComplaintSlaSummaryResponse(
                settings.firstResponseHours(),
                settings.resolutionHours(),
                complaints.size(),
                metrics.slaViolationsCount(),
                metrics.slaComplianceRate(),
                metrics.reopenedComplaintsCount(),
                breached
        );
    }

    @Transactional(readOnly = true)
    public ComplaintSlaSettings getSettings(UUID organizationId) {
        Organization organization = operationsGuard.requireOrganization(organizationId);
        return ComplaintSlaSettings.from(organization);
    }

    @Transactional(readOnly = true)
    public boolean isBreached(Complaint complaint, ComplaintSlaSettings settings) {
        return slaEvaluator.isBreached(complaint, settings, Instant.now(clock));
    }

    private ComplaintSlaBreachItemResponse toBreachItem(
            Complaint complaint,
            ComplaintSlaSettings settings,
            Instant now
    ) {
        List<ComplaintSlaBreachType> breachTypes = slaEvaluator.evaluateBreachTypes(complaint, settings, now);
        return new ComplaintSlaBreachItemResponse(
                complaint.getId(),
                complaint.getTitle(),
                complaint.getStatus(),
                complaint.getCategory(),
                complaint.getPriority(),
                complaint.getCreatedAt(),
                complaint.getFirstResponseAt(),
                complaint.getResolvedAt(),
                breachTypes
        );
    }
}
