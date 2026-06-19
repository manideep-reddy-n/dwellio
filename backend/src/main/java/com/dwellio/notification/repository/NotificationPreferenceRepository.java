package com.dwellio.notification.repository;

import com.dwellio.domain.entity.NotificationPreference;
import com.dwellio.domain.enums.NotificationPreferenceCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    @Query("SELECT p FROM NotificationPreference p WHERE p.user.id = :userId")
    List<NotificationPreference> findAllByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT p FROM NotificationPreference p
            WHERE p.user.id = :userId AND p.category = :category
            """)
    Optional<NotificationPreference> findByUserIdAndCategory(
            @Param("userId") UUID userId,
            @Param("category") NotificationPreferenceCategory category
    );
}
