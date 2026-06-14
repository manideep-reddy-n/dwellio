package com.dwellio.foodmenu.repository;

import com.dwellio.domain.entity.FoodMenuSlot;
import com.dwellio.domain.enums.MealType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodMenuSlotRepository extends JpaRepository<FoodMenuSlot, UUID> {

    List<FoodMenuSlot> findAllByOrganizationIdOrderByDayOfWeekAscMealTypeAsc(UUID organizationId);

    Optional<FoodMenuSlot> findByOrganizationIdAndDayOfWeekAndMealType(
            UUID organizationId,
            short dayOfWeek,
            MealType mealType
    );
}
