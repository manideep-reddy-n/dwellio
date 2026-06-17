package com.dwellio.mealfeedback.controller;

import com.dwellio.mealfeedback.dto.MealFeedbackResponse;
import com.dwellio.mealfeedback.dto.MealFeedbackSummaryResponse;
import com.dwellio.mealfeedback.dto.UpsertMealFeedbackRequest;
import com.dwellio.mealfeedback.service.MealFeedbackService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/meal-feedback")
@RequiredArgsConstructor
public class MealFeedbackController {

    private final MealFeedbackService mealFeedbackService;

    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:read_own')")
    public MealFeedbackResponse upsert(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpsertMealFeedbackRequest request
    ) {
        return mealFeedbackService.upsert(organizationId, request);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:read_own')")
    public List<MealFeedbackResponse> listMine(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return mealFeedbackService.listMine(organizationId, date);
    }

    @GetMapping("/summary")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'dashboard:view')")
    public MealFeedbackSummaryResponse summary(@PathVariable UUID organizationId) {
        return mealFeedbackService.getSummary(organizationId);
    }
}
