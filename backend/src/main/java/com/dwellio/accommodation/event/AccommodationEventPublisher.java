package com.dwellio.accommodation.event;

import com.dwellio.common.event.AfterCommitEventPublisher;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccommodationEventPublisher {

    private final AfterCommitEventPublisher afterCommitEventPublisher;

    public void publishOccupancyAllocated(OccupancyAllocatedEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishOccupancyReleased(OccupancyReleasedEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishOccupancyTransferred(OccupancyTransferredEvent event) {
        afterCommitEventPublisher.publish(event);
    }

    public void publishStructureChanged(UUID organizationId) {
        afterCommitEventPublisher.publish(new AccommodationStructureChangedEvent(organizationId));
    }
}
