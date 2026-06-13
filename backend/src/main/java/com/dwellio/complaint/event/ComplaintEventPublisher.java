package com.dwellio.complaint.event;

import com.dwellio.common.event.AfterCommitEventPublisher;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ComplaintEventPublisher {

    private final AfterCommitEventPublisher afterCommitEventPublisher;

    public void publishMetricsChanged(UUID organizationId) {
        afterCommitEventPublisher.publish(new ComplaintMetricsChangedEvent(organizationId));
    }

    public void publishCreated(ComplaintCreatedEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishAssigned(ComplaintAssignedEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishResolved(ComplaintResolvedEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishReopened(ComplaintReopenedEvent event) {
        afterCommitEventPublisher.publish(event);
    }
}
