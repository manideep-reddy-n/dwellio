package com.dwellio.metrics.event;

import com.dwellio.accommodation.event.AccommodationStructureChangedEvent;
import com.dwellio.accommodation.event.OccupancyAllocatedEvent;
import com.dwellio.accommodation.event.OccupancyReleasedEvent;
import com.dwellio.accommodation.event.OccupancyTransferredEvent;
import com.dwellio.complaint.event.ComplaintMetricsChangedEvent;
import com.dwellio.metrics.service.MetricsProjectionService;
import com.dwellio.payment.event.PaymentMetricsChangedEvent;
import com.dwellio.review.event.ReviewMetricsChangedEvent;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsEventListener {

    private final MetricsProjectionService metricsProjectionService;

    @Async
    @EventListener
    public void onOccupancyAllocated(OccupancyAllocatedEvent event) {
        refreshAvailabilitySafely(event.organizationId(), "OccupancyAllocatedEvent");
        refreshLifecycleSafely(event.organizationId(), "OccupancyAllocatedEvent");
    }

    @Async
    @EventListener
    public void onOccupancyReleased(OccupancyReleasedEvent event) {
        refreshAvailabilitySafely(event.organizationId(), "OccupancyReleasedEvent");
        refreshLifecycleSafely(event.organizationId(), "OccupancyReleasedEvent");
    }

    @Async
    @EventListener
    public void onOccupancyTransferred(OccupancyTransferredEvent event) {
        refreshAvailabilitySafely(event.organizationId(), "OccupancyTransferredEvent");
        refreshLifecycleSafely(event.organizationId(), "OccupancyTransferredEvent");
    }

    @Async
    @EventListener
    public void onAccommodationStructureChanged(AccommodationStructureChangedEvent event) {
        refreshAvailabilitySafely(event.organizationId(), "AccommodationStructureChangedEvent");
    }

    @Async
    @EventListener
    public void onMembershipActivated(MembershipActivatedEvent event) {
        refreshResidentCountSafely(event.organizationId(), "MembershipActivatedEvent");
    }

    @Async
    @EventListener
    public void onComplaintMetricsChanged(ComplaintMetricsChangedEvent event) {
        refreshComplaintMetricsSafely(event.organizationId(), "ComplaintMetricsChangedEvent");
    }

    @Async
    @EventListener
    public void onReviewMetricsChanged(ReviewMetricsChangedEvent event) {
        refreshReviewMetricsSafely(event.organizationId(), "ReviewMetricsChangedEvent");
    }

    @Async
    @EventListener
    public void onPaymentMetricsChanged(PaymentMetricsChangedEvent event) {
        refreshRevenueMetricsSafely(event.organizationId(), "PaymentMetricsChangedEvent");
    }

    private void refreshAvailabilitySafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshAvailability(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh availability metrics for organization {} after {}", organizationId, eventType, ex);
        }
    }

    private void refreshResidentCountSafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshResidentCount(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh resident count for organization {} after {}", organizationId, eventType, ex);
        }
    }

    private void refreshComplaintMetricsSafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshComplaintMetrics(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh complaint metrics for organization {} after {}", organizationId, eventType, ex);
        }
    }

    private void refreshReviewMetricsSafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshReviewMetrics(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh review metrics for organization {} after {}", organizationId, eventType, ex);
        }
    }

    private void refreshRevenueMetricsSafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshRevenueMetrics(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh revenue metrics for organization {} after {}", organizationId, eventType, ex);
        }
    }

    private void refreshLifecycleSafely(UUID organizationId, String eventType) {
        try {
            metricsProjectionService.refreshLifecycleMetrics(organizationId);
        } catch (Exception ex) {
            log.error("Failed to refresh lifecycle metrics for organization {} after {}", organizationId, eventType, ex);
        }
    }
}
