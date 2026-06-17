package com.dwellio.ownership.controller;

import com.dwellio.ownership.dto.CreateOwnershipRecordRequest;
import com.dwellio.ownership.dto.OwnershipRecordResponse;
import com.dwellio.ownership.service.OwnershipService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/ownership")
@RequiredArgsConstructor
public class OwnershipController {

    private final OwnershipService ownershipService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public List<OwnershipRecordResponse> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) UUID unitSpaceId
    ) {
        return ownershipService.list(organizationId, unitSpaceId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public OwnershipRecordResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateOwnershipRecordRequest request
    ) {
        return ownershipService.create(organizationId, request);
    }
}
