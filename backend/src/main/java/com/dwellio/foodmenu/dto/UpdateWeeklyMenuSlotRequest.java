package com.dwellio.foodmenu.dto;

import com.dwellio.domain.enums.MealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateWeeklyMenuSlotRequest(
        @NotNull @Min(1) @Max(7) Integer dayOfWeek,
        @NotNull MealType mealType,
        @Size(max = 5000) String items
) {
}
