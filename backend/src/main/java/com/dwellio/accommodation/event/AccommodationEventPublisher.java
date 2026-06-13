package com.dwellio.accommodation.event;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccommodationEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publishOccupancyAllocated(OccupancyAllocatedEvent event) {
        eventPublisher.publishEvent(event);
    }

    public void publishOccupancyReleased(OccupancyReleasedEvent event) {
        eventPublisher.publishEvent(event);
    }

    public void publishOccupancyTransferred(OccupancyTransferredEvent event) {
        eventPublisher.publishEvent(event);
    }

    public void publishStructureChanged(UUID organizationId) {
        eventPublisher.publishEvent(new AccommodationStructureChangedEvent(organizationId));
    }
}
