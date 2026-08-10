package com.dwellio.activity.controller;

import com.dwellio.activity.dto.ActivityEventResponse;
import com.dwellio.activity.service.ActivityEventService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me/timeline")
@RequiredArgsConstructor
public class UserTimelineController {

    private final ActivityEventService activityEventService;

    /**
     * Returns all activity events for the currently authenticated user
     * across all organizations they have ever been a member of.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ActivityEventResponse> listAllMine() {
        return activityEventService.listAllMine();
    }
}
