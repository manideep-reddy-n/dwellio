package com.dwellio.push.controller;

import com.dwellio.push.dto.PushSubscriptionResponse;
import com.dwellio.push.dto.RegisterPushSubscriptionRequest;
import com.dwellio.push.service.PushSubscriptionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/push/subscriptions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PushSubscriptionController {

    private final PushSubscriptionService pushSubscriptionService;

    @GetMapping
    public List<PushSubscriptionResponse> list() {
        return pushSubscriptionService.listMine();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PushSubscriptionResponse register(@Valid @RequestBody RegisterPushSubscriptionRequest request) {
        return pushSubscriptionService.register(request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@RequestParam String endpoint) {
        pushSubscriptionService.unregister(endpoint);
    }
}
