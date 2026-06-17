package com.dwellio.payment.scheduler;

import com.dwellio.payment.service.PaymentReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentReminderScheduler {

    private final PaymentReminderService paymentReminderService;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendPaymentReminders() {
        log.info("Running daily payment reminder job");
        paymentReminderService.sendScheduledReminders();
    }
}
