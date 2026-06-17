package com.dwellio.mealfeedback.repository;

import com.dwellio.domain.entity.MealFeedback;
import com.dwellio.domain.enums.MealType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MealFeedbackRepository extends JpaRepository<MealFeedback, UUID> {

    @Query("""
            SELECT mf FROM MealFeedback mf
            WHERE mf.organization.id = :organizationId
              AND mf.membership.id = :membershipId
              AND mf.feedbackDate = :feedbackDate
              AND mf.deletedAt IS NULL
            ORDER BY mf.mealType ASC
            """)
    List<MealFeedback> findAllByOrganizationIdAndMembershipIdAndFeedbackDate(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId,
            @Param("feedbackDate") LocalDate feedbackDate
    );

    @Query("""
            SELECT mf FROM MealFeedback mf
            WHERE mf.organization.id = :organizationId
              AND mf.membership.id = :membershipId
              AND mf.feedbackDate = :feedbackDate
              AND mf.mealType = :mealType
              AND mf.deletedAt IS NULL
            """)
    Optional<MealFeedback> findActiveByOrganizationIdAndMembershipIdAndFeedbackDateAndMealType(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId,
            @Param("feedbackDate") LocalDate feedbackDate,
            @Param("mealType") MealType mealType
    );
}
