package com.dwellio.push.controller;

import com.dwellio.push.config.PushProperties;
import com.dwellio.push.dto.PushConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
public class PushConfigController {

    private final PushProperties pushProperties;

    @GetMapping("/config")
    @PreAuthorize("isAuthenticated()")
    public PushConfigResponse config() {
        return new PushConfigResponse(
                pushProperties.vapidPublicKey(),
                pushProperties.isConfigured()
        );
    }
}
