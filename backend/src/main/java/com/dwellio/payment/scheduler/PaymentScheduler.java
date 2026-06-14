package com.dwellio.payment.scheduler;

import com.dwellio.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduler {

    private final PaymentService paymentService;

    @Scheduled(cron = "0 0 2 * * *")
    public void syncRecurringRent() {
        log.info("Running nightly rent sync");
        paymentService.syncAllOrganizations();
    }
}
