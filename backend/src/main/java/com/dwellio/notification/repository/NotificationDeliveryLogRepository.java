package com.dwellio.notification.repository;

import com.dwellio.domain.entity.NotificationDeliveryLog;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationDeliveryLogRepository extends JpaRepository<NotificationDeliveryLog, UUID> {

    @Query("""
            SELECT COUNT(l) FROM NotificationDeliveryLog l
            WHERE l.status = :status AND l.createdAt >= :since
            """)
    long countByStatusSince(
            @Param("status") NotificationDeliveryStatus status,
            @Param("since") Instant since
    );

    Page<NotificationDeliveryLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
