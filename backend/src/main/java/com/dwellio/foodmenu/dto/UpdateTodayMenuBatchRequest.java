package com.dwellio.foodmenu.dto;

import com.dwellio.domain.enums.MealType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateTodayMenuBatchRequest(
        @NotEmpty @Valid List<MealOverride> meals
) {
    public record MealOverride(
            @NotNull MealType mealType,
            String items
    ) {
    }
}
