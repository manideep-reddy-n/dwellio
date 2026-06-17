package com.dwellio.payment.event;

import com.dwellio.common.event.AfterCommitEventPublisher;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final AfterCommitEventPublisher afterCommitEventPublisher;

    public void publishMetricsChanged(UUID organizationId) {
        afterCommitEventPublisher.publish(new PaymentMetricsChangedEvent(organizationId));
    }
}
