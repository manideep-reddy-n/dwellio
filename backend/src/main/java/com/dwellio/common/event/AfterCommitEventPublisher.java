package com.dwellio.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Component
@RequiredArgsConstructor
public class AfterCommitEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publish(Object event) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        eventPublisher.publishEvent(event);
                    } catch (Exception ex) {
                        log.error(
                                "After-commit handler failed for {}: {}",
                                event.getClass().getSimpleName(),
                                ex.getMessage(),
                                ex
                        );
                    }
                }
            });
            return;
        }
        try {
            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error(
                    "Event handler failed for {}: {}",
                    event.getClass().getSimpleName(),
                    ex.getMessage(),
                    ex
            );
        }
    }
}
