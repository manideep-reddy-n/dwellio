package com.dwellio.admin.controller;

import com.dwellio.platform.dto.PlatformSettingResponse;
import com.dwellio.platform.dto.UpdatePlatformSettingRequest;
import com.dwellio.platform.service.PlatformConfigService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminConfigController {

    private final PlatformConfigService platformConfigService;

    @GetMapping
    public List<PlatformSettingResponse> list(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return platformConfigService.listByCategory(category);
        }
        return platformConfigService.listAll();
    }

    @PatchMapping("/{settingKey}")
    public PlatformSettingResponse update(
            @PathVariable String settingKey,
            @Valid @RequestBody UpdatePlatformSettingRequest request
    ) {
        return platformConfigService.update(settingKey, request);
    }
}
