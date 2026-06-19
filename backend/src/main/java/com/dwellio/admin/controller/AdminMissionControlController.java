package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminMissionControlResponse;
import com.dwellio.admin.service.AdminMissionControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/mission-control")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminMissionControlController {

    private final AdminMissionControlService missionControlService;

    @GetMapping
    public AdminMissionControlResponse missionControl() {
        return missionControlService.getMissionControl();
    }
}
