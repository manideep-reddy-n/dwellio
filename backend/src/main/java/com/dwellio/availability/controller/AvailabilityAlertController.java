package com.dwellio.availability.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.availability.dto.AvailabilityAlertResponse;
import com.dwellio.availability.service.AvailabilityAlertService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/availability-alerts")
@RequiredArgsConstructor
public class AvailabilityAlertController {

    private final AvailabilityAlertService availabilityAlertService;

    @GetMapping
    public List<AvailabilityAlertResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return availabilityAlertService.listForUser(principal.getId());
    }

    @GetMapping("/{slug}/status")
    public Map<String, Boolean> status(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug
    ) {
        return Map.of("subscribed", availabilityAlertService.isSubscribed(principal.getId(), slug));
    }

    @PostMapping("/{slug}")
    @ResponseStatus(HttpStatus.CREATED)
    public AvailabilityAlertResponse subscribe(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug
    ) {
        return availabilityAlertService.subscribe(principal.getId(), slug);
    }

    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug
    ) {
        availabilityAlertService.unsubscribe(principal.getId(), slug);
    }
}
