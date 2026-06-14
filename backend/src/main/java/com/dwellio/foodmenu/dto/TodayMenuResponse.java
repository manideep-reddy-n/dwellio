package com.dwellio.foodmenu.dto;

import java.util.List;

public record TodayMenuResponse(
        String date,
        String dayLabel,
        List<FoodMenuMealResponse> meals
) {
}
