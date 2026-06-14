package com.dwellio.foodmenu.repository;

import com.dwellio.domain.entity.FoodMenuDailyOverride;
import com.dwellio.domain.enums.MealType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FoodMenuDailyOverrideRepository extends JpaRepository<FoodMenuDailyOverride, UUID> {

    @Query("""
            SELECT o FROM FoodMenuDailyOverride o
            WHERE o.organization.id = :organizationId AND o.menuDate = :menuDate
            """)
    List<FoodMenuDailyOverride> findByOrganizationIdAndMenuDate(
            @Param("organizationId") UUID organizationId,
            @Param("menuDate") LocalDate menuDate
    );

    Optional<FoodMenuDailyOverride> findByOrganizationIdAndMenuDateAndMealType(
            UUID organizationId,
            LocalDate menuDate,
            MealType mealType
    );
}
