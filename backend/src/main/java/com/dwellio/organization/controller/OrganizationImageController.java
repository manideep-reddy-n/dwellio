package com.dwellio.organization.controller;

import com.dwellio.organization.dto.OrganizationImageResponse;
import com.dwellio.organization.service.OrganizationImageService;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/organizations/{organizationId}/images")
@RequiredArgsConstructor
public class OrganizationImageController {

    private final OrganizationImageService organizationImageService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:read') or @authz.hasPermission(#organizationId, 'announcement:read_own')")
    public List<OrganizationImageResponse> list(@PathVariable UUID organizationId) {
        return organizationImageService.list(organizationId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public OrganizationImageResponse upload(
            @PathVariable UUID organizationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption
    ) throws IOException {
        return organizationImageService.upload(organizationId, file, caption);
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public void delete(@PathVariable UUID organizationId, @PathVariable UUID imageId) {
        organizationImageService.delete(organizationId, imageId);
    }
}
