package com.dwellio.foodmenu.service;

import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.FoodMenuDailyOverride;
import com.dwellio.domain.entity.FoodMenuSlot;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.MealType;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.foodmenu.dto.FoodMenuDayResponse;
import com.dwellio.foodmenu.dto.FoodMenuMealResponse;
import com.dwellio.foodmenu.dto.TodayMenuResponse;
import com.dwellio.foodmenu.dto.UpdateTodayMenuBatchRequest;
import com.dwellio.foodmenu.dto.UpdateTodayMenuOverrideRequest;
import com.dwellio.foodmenu.dto.UpdateWeeklyMenuSlotRequest;
import com.dwellio.foodmenu.repository.FoodMenuDailyOverrideRepository;
import com.dwellio.foodmenu.repository.FoodMenuSlotRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.service.OrganizationService;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FoodMenuService {

    private static final MealType[] MEALS = MealType.values();

    private final FoodMenuSlotRepository slotRepository;
    private final FoodMenuDailyOverrideRepository overrideRepository;
    private final OrganizationService organizationService;
    private final AuthorizationService authorizationService;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<FoodMenuDayResponse> getWeeklyMenu(UUID organizationId) {
        requireFoodMenuOrg(organizationId);
        List<FoodMenuSlot> slots = slotRepository.findAllByOrganizationIdOrderByDayOfWeekAscMealTypeAsc(organizationId);
        List<FoodMenuDayResponse> days = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            short dayOfWeek = (short) day;
            List<FoodMenuMealResponse> meals = new ArrayList<>();
            for (MealType meal : MEALS) {
                String items = slots.stream()
                        .filter(s -> s.getDayOfWeek() == dayOfWeek && s.getMealType() == meal)
                        .map(FoodMenuSlot::getItems)
                        .findFirst()
                        .orElse("");
                meals.add(new FoodMenuMealResponse(meal, items, false));
            }
            days.add(new FoodMenuDayResponse(day, dayLabel(day), meals));
        }
        return days;
    }

    @Transactional(readOnly = true)
    public TodayMenuResponse getTodayMenu(UUID organizationId) {
        requireFoodMenuOrg(organizationId);
        LocalDate today = LocalDate.now(clock);
        return buildTodayMenu(organizationId, today);
    }

    @Transactional
    public FoodMenuDayResponse updateWeeklySlot(UUID organizationId, UpdateWeeklyMenuSlotRequest request) {
        authorizationService.requirePermission(organizationId, "organization:update");
        Organization organization = requireFoodMenuOrg(organizationId);

        FoodMenuSlot slot = slotRepository
                .findByOrganizationIdAndDayOfWeekAndMealType(
                        organizationId,
                        request.dayOfWeek().shortValue(),
                        request.mealType()
                )
                .orElseGet(() -> {
                    FoodMenuSlot created = new FoodMenuSlot();
                    created.setId(UUID.randomUUID());
                    created.setOrganization(organization);
                    created.setDayOfWeek(request.dayOfWeek().shortValue());
                    created.setMealType(request.mealType());
                    return created;
                });
        slot.setItems(request.items() != null ? request.items().trim() : "");
        slotRepository.save(slot);

        return buildDay(organizationId, request.dayOfWeek());
    }

    @Transactional
    public TodayMenuResponse updateTodayOverride(UUID organizationId, UpdateTodayMenuOverrideRequest request) {
        authorizationService.requirePermission(organizationId, "organization:update");
        Organization organization = requireFoodMenuOrg(organizationId);
        LocalDate today = LocalDate.now(clock);

        saveTodayOverride(organization, organizationId, today, request.mealType(), request.items());
        notifyResidentsMenuChanged(organizationId, organization.getSlug());

        return buildTodayMenu(organizationId, today);
    }

    @Transactional
    public TodayMenuResponse updateTodayOverrides(UUID organizationId, UpdateTodayMenuBatchRequest request) {
        authorizationService.requirePermission(organizationId, "organization:update");
        Organization organization = requireFoodMenuOrg(organizationId);
        LocalDate today = LocalDate.now(clock);

        for (UpdateTodayMenuBatchRequest.MealOverride meal : request.meals()) {
            saveTodayOverride(organization, organizationId, today, meal.mealType(), meal.items());
        }
        notifyResidentsMenuChanged(organizationId, organization.getSlug());

        return buildTodayMenu(organizationId, today);
    }

    private void saveTodayOverride(
            Organization organization,
            UUID organizationId,
            LocalDate today,
            MealType mealType,
            String items
    ) {
        FoodMenuDailyOverride override = overrideRepository
                .findByOrganizationIdAndMenuDateAndMealType(organizationId, today, mealType)
                .orElseGet(() -> {
                    FoodMenuDailyOverride created = new FoodMenuDailyOverride();
                    created.setId(UUID.randomUUID());
                    created.setOrganization(organization);
                    created.setMenuDate(today);
                    created.setMealType(mealType);
                    return created;
                });
        override.setItems(items != null ? items.trim() : "");
        overrideRepository.save(override);
    }

    private TodayMenuResponse buildTodayMenu(UUID organizationId, LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        List<FoodMenuDailyOverride> overrides = overrideRepository.findByOrganizationIdAndMenuDate(organizationId, date);
        List<FoodMenuSlot> weekly = slotRepository.findAllByOrganizationIdOrderByDayOfWeekAscMealTypeAsc(organizationId);

        List<FoodMenuMealResponse> meals = new ArrayList<>();
        for (MealType meal : MEALS) {
            var override = overrides.stream().filter(o -> o.getMealType() == meal).findFirst();
            if (override.isPresent()) {
                meals.add(new FoodMenuMealResponse(meal, override.get().getItems(), true));
            } else {
                String items = weekly.stream()
                        .filter(s -> s.getDayOfWeek() == dayOfWeek && s.getMealType() == meal)
                        .map(FoodMenuSlot::getItems)
                        .findFirst()
                        .orElse("");
                meals.add(new FoodMenuMealResponse(meal, items, false));
            }
        }
        return new TodayMenuResponse(date.toString(), dayLabel(dayOfWeek), meals);
    }

    private FoodMenuDayResponse buildDay(UUID organizationId, int dayOfWeek) {
        List<FoodMenuSlot> slots = slotRepository.findAllByOrganizationIdOrderByDayOfWeekAscMealTypeAsc(organizationId);
        List<FoodMenuMealResponse> meals = new ArrayList<>();
        for (MealType meal : MEALS) {
            String items = slots.stream()
                    .filter(s -> s.getDayOfWeek() == dayOfWeek && s.getMealType() == meal)
                    .map(FoodMenuSlot::getItems)
                    .findFirst()
                    .orElse("");
            meals.add(new FoodMenuMealResponse(meal, items, false));
        }
        return new FoodMenuDayResponse(dayOfWeek, dayLabel(dayOfWeek), meals);
    }

    private Organization requireFoodMenuOrg(UUID organizationId) {
        Organization organization = organizationService.findActiveOrganization(organizationId);
        if (organization.getType() != OrganizationType.HOSTEL && organization.getType() != OrganizationType.PG) {
            throw new com.dwellio.common.exception.BadRequestException("Food menu is available for hostels and PGs only");
        }
        return organization;
    }

    private void notifyResidentsMenuChanged(UUID organizationId, String slug) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("organizationId", organizationId.toString());
        payload.put("organizationSlug", slug);
        payload.put("targetPath", "/app/" + slug + "/resident#menu");
        for (var resident : membershipRepository.findActiveResidentsByOrganizationId(organizationId)) {
            notificationService.create(
                    resident.getUser().getId(),
                    organizationId,
                    NotificationType.FOOD_MENU_UPDATED,
                    "Today's menu updated",
                    "Today's food menu has been updated.",
                    payload
            );
        }
    }

    private static String dayLabel(int dayOfWeek) {
        return DayOfWeek.of(dayOfWeek).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }
}
