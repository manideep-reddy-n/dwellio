package com.dwellio.announcement.controller;

import com.dwellio.announcement.dto.AnnouncementResponse;
import com.dwellio.announcement.dto.CreateAnnouncementRequest;
import com.dwellio.announcement.dto.UpdateAnnouncementRequest;
import com.dwellio.announcement.service.AnnouncementService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:manage')")
    public AnnouncementResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateAnnouncementRequest request
    ) {
        return announcementService.create(organizationId, request);
    }

    @GetMapping
    @PreAuthorize("@authz.requireMembership(#organizationId) != null")
    public List<AnnouncementResponse> list(@PathVariable UUID organizationId) {
        return announcementService.list(organizationId);
    }

    @GetMapping("/{announcementId}")
    @PreAuthorize("@authz.requireMembership(#organizationId) != null")
    public AnnouncementResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID announcementId
    ) {
        return announcementService.get(organizationId, announcementId);
    }

    @PatchMapping("/{announcementId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:manage')")
    public AnnouncementResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID announcementId,
            @Valid @RequestBody UpdateAnnouncementRequest request
    ) {
        return announcementService.update(organizationId, announcementId, request);
    }

    @PostMapping("/{announcementId}/publish")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:manage')")
    public AnnouncementResponse publish(
            @PathVariable UUID organizationId,
            @PathVariable UUID announcementId
    ) {
        return announcementService.publish(organizationId, announcementId);
    }

    @DeleteMapping("/{announcementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'announcement:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID announcementId
    ) {
        announcementService.delete(organizationId, announcementId);
    }
}
