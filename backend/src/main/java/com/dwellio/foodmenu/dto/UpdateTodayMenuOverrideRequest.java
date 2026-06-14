package com.dwellio.foodmenu.dto;

import com.dwellio.domain.enums.MealType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTodayMenuOverrideRequest(
        @NotNull MealType mealType,
        @Size(max = 5000) String items
) {
}
