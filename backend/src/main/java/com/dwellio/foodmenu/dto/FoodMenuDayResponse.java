package com.dwellio.foodmenu.dto;

import java.util.List;

public record FoodMenuDayResponse(
        int dayOfWeek,
        String dayLabel,
        List<FoodMenuMealResponse> meals
) {
}
