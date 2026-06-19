package com.dwellio.push.repository;

import com.dwellio.domain.entity.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    @Query("""
            SELECT s FROM PushSubscription s
            WHERE s.user.id = :userId AND s.deletedAt IS NULL
            """)
    List<PushSubscription> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT s FROM PushSubscription s
            WHERE s.user.id = :userId AND s.endpoint = :endpoint AND s.deletedAt IS NULL
            """)
    Optional<PushSubscription> findActiveByUserIdAndEndpoint(
            @Param("userId") UUID userId,
            @Param("endpoint") String endpoint
    );

    @Query("SELECT COUNT(s) FROM PushSubscription s WHERE s.deletedAt IS NULL")
    long countActive();
}
