package com.dwellio.foodmenu.dto;

import com.dwellio.domain.enums.MealType;

public record FoodMenuMealResponse(
        MealType mealType,
        String items,
        boolean overridden
) {
}
