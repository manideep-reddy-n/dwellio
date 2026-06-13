package com.dwellio.bed.controller;

import com.dwellio.bed.dto.BedResponse;
import com.dwellio.bed.dto.CreateBedRequest;
import com.dwellio.bed.dto.UpdateBedRequest;
import com.dwellio.bed.service.BedService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BedController {

    private final BedService bedService;

    @GetMapping("/organizations/{organizationId}/spaces/{spaceId}/beds")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public List<BedResponse> listBySpace(
            @PathVariable UUID organizationId,
            @PathVariable UUID spaceId
    ) {
        return bedService.listBySpace(organizationId, spaceId);
    }

    @PostMapping("/organizations/{organizationId}/spaces/{spaceId}/beds")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public BedResponse create(
            @PathVariable UUID organizationId,
            @PathVariable UUID spaceId,
            @Valid @RequestBody CreateBedRequest request
    ) {
        return bedService.create(organizationId, spaceId, request);
    }

    @PatchMapping("/organizations/{organizationId}/beds/{bedId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public BedResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID bedId,
            @Valid @RequestBody UpdateBedRequest request
    ) {
        return bedService.update(organizationId, bedId, request);
    }

    @DeleteMapping("/organizations/{organizationId}/beds/{bedId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID bedId
    ) {
        bedService.delete(organizationId, bedId);
    }
}
