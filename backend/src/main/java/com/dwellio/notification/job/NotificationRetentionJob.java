package com.dwellio.notification.job;

import com.dwellio.notification.repository.NotificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRetentionJob {

    private static final int RETENTION_DAYS = 10;

    private final NotificationRepository notificationRepository;
    private final Clock clock;

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeOldNotifications() {
        Instant cutoff = Instant.now(clock).minus(RETENTION_DAYS, ChronoUnit.DAYS);
        int deleted = notificationRepository.deleteOlderThan(cutoff);
        if (deleted > 0) {
            log.info("Purged {} notifications older than {} days", deleted, RETENTION_DAYS);
        }
    }
}
