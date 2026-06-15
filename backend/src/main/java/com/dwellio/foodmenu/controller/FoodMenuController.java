package com.dwellio.foodmenu.controller;

import com.dwellio.foodmenu.dto.FoodMenuDayResponse;
import com.dwellio.foodmenu.dto.TodayMenuResponse;
import com.dwellio.foodmenu.dto.UpdateTodayMenuBatchRequest;
import com.dwellio.foodmenu.dto.UpdateTodayMenuOverrideRequest;
import com.dwellio.foodmenu.dto.UpdateWeeklyMenuSlotRequest;
import com.dwellio.foodmenu.service.FoodMenuService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/food-menu")
@RequiredArgsConstructor
public class FoodMenuController {

    private final FoodMenuService foodMenuService;

    @GetMapping("/weekly")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update') or @authz.hasPermission(#organizationId, 'announcement:read_own')")
    public List<FoodMenuDayResponse> weekly(@PathVariable UUID organizationId) {
        return foodMenuService.getWeeklyMenu(organizationId);
    }

    @GetMapping("/today")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update') or @authz.hasPermission(#organizationId, 'announcement:read_own')")
    public TodayMenuResponse today(@PathVariable UUID organizationId) {
        return foodMenuService.getTodayMenu(organizationId);
    }

    @PatchMapping("/weekly")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public FoodMenuDayResponse updateWeekly(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateWeeklyMenuSlotRequest request
    ) {
        return foodMenuService.updateWeeklySlot(organizationId, request);
    }

    @PatchMapping("/today")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public TodayMenuResponse updateToday(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateTodayMenuOverrideRequest request
    ) {
        return foodMenuService.updateTodayOverride(organizationId, request);
    }

    @PutMapping("/today")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public TodayMenuResponse updateTodayBatch(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateTodayMenuBatchRequest request
    ) {
        return foodMenuService.updateTodayOverrides(organizationId, request);
    }
}
