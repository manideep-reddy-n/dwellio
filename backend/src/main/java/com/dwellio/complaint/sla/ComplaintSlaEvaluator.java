package com.dwellio.complaint.sla;

import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.enums.ComplaintStatus;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ComplaintSlaEvaluator {

    private static final Set<ComplaintStatus> OPEN_STATUSES = EnumSet.of(
            ComplaintStatus.OPEN,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.REOPENED
    );

    public boolean isBreached(Complaint complaint, ComplaintSlaSettings settings, Instant now) {
        return !evaluateBreachTypes(complaint, settings, now).isEmpty();
    }

    public List<ComplaintSlaBreachType> evaluateBreachTypes(
            Complaint complaint,
            ComplaintSlaSettings settings,
            Instant now
    ) {
        List<ComplaintSlaBreachType> breaches = new ArrayList<>();
        double firstResponseLimit = settings.firstResponseHours().doubleValue();
        double resolutionLimit = settings.resolutionHours().doubleValue();

        double hoursToFirstResponse = complaint.getFirstResponseAt() == null
                ? hoursBetween(complaint.getCreatedAt(), now)
                : hoursBetween(complaint.getCreatedAt(), complaint.getFirstResponseAt());
        if (hoursToFirstResponse > firstResponseLimit) {
            breaches.add(ComplaintSlaBreachType.FIRST_RESPONSE);
        }

        boolean open = OPEN_STATUSES.contains(complaint.getStatus());
        double hoursToResolution = complaint.getResolvedAt() == null
                ? (open ? hoursBetween(complaint.getCreatedAt(), now) : 0)
                : hoursBetween(complaint.getCreatedAt(), complaint.getResolvedAt());
        if (open && hoursToResolution > resolutionLimit) {
            breaches.add(ComplaintSlaBreachType.RESOLUTION);
        } else if (complaint.getResolvedAt() != null && hoursToResolution > resolutionLimit) {
            breaches.add(ComplaintSlaBreachType.RESOLUTION);
        }

        return breaches;
    }

    private static double hoursBetween(Instant start, Instant end) {
        return Duration.between(start, end).toMillis() / 3_600_000.0;
    }
}
