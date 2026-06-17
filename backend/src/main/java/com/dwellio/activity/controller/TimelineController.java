package com.dwellio.activity.controller;

import com.dwellio.activity.dto.ActivityEventResponse;
import com.dwellio.activity.dto.TimelineRebuildResponse;
import com.dwellio.activity.service.ActivityEventBackfillService;
import com.dwellio.activity.service.ActivityEventService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final ActivityEventService activityEventService;
    private final ActivityEventBackfillService activityEventBackfillService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public List<ActivityEventResponse> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) UUID membershipId
    ) {
        return activityEventService.listForOrganization(organizationId, membershipId);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'allocation:read_own')")
    public List<ActivityEventResponse> listMine(@PathVariable UUID organizationId) {
        return activityEventService.listMine(organizationId);
    }

    @PostMapping("/rebuild")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public TimelineRebuildResponse rebuild(@PathVariable UUID organizationId) {
        int eventsWritten = activityEventBackfillService.backfillOrganization(organizationId);
        return new TimelineRebuildResponse(eventsWritten);
    }
}
