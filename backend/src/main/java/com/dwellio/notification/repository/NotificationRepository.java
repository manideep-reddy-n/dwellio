package com.dwellio.notification.repository;

import com.dwellio.domain.entity.Notification;
import com.dwellio.domain.enums.NotificationStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
            SELECT n FROM Notification n
            JOIN FETCH n.user u
            LEFT JOIN FETCH n.organization o
            WHERE n.id = :notificationId
            """)
    Optional<Notification> findByIdWithDetails(@Param("notificationId") UUID notificationId);

    @Query("""
            SELECT n FROM Notification n
            JOIN FETCH n.user u
            LEFT JOIN FETCH n.organization o
            WHERE n.user.id = :userId
              AND (:organizationId IS NULL OR n.organization.id = :organizationId)
              AND (:unreadOnly = FALSE OR n.status = 'UNREAD')
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> findInbox(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId,
            @Param("unreadOnly") boolean unreadOnly,
            Pageable pageable
    );

    @Query("""
            SELECT n FROM Notification n
            JOIN FETCH n.user u
            LEFT JOIN FETCH n.organization o
            WHERE n.id = :notificationId
              AND n.user.id = :userId
            """)
    Optional<Notification> findByIdAndUserId(
            @Param("notificationId") UUID notificationId,
            @Param("userId") UUID userId
    );

    long countByUserIdAndStatus(UUID userId, NotificationStatus status);

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Notification n
            SET n.status = 'READ', n.readAt = :readAt
            WHERE n.user.id = :userId
              AND n.status = 'UNREAD'
            """)
    int markAllRead(@Param("userId") UUID userId, @Param("readAt") java.time.Instant readAt);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.user_id = :userId
                  AND n.organization_id = :organizationId
                  AND n.type = CAST(:type AS VARCHAR)
                  AND n.created_at >= :since
                  AND n.payload_json::text LIKE CONCAT('%', :paymentId, '%')
            )
            """, nativeQuery = true)
    boolean existsRecentForPayment(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId,
            @Param("type") String type,
            @Param("paymentId") String paymentId,
            @Param("since") Instant since
    );

    @Modifying(clearAutomatically = true)
    @Query("""
            DELETE FROM Notification n
            WHERE n.createdAt < :cutoff
            """)
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
