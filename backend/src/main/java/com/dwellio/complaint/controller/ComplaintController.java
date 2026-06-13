package com.dwellio.complaint.controller;

import com.dwellio.complaint.dto.AddComplaintAttachmentRequest;
import com.dwellio.complaint.dto.AssignComplaintRequest;
import com.dwellio.complaint.dto.ComplaintAttachmentResponse;
import com.dwellio.complaint.dto.ComplaintResponse;
import com.dwellio.complaint.dto.CreateComplaintRequest;
import com.dwellio.complaint.dto.UpdateComplaintRequest;
import com.dwellio.complaint.service.ComplaintService;
import com.dwellio.domain.enums.ComplaintCategory;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:create')")
    public ComplaintResponse create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateComplaintRequest request
    ) {
        return complaintService.create(organizationId, request);
    }

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:read')")
    public List<ComplaintResponse> listAll(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) ComplaintCategory category
    ) {
        return complaintService.listAll(organizationId, category);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:read_own')")
    public List<ComplaintResponse> listMine(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) ComplaintCategory category
    ) {
        return complaintService.listMine(organizationId, category);
    }

    @GetMapping("/{complaintId}")
    @PreAuthorize("@authz.requireMembership(#organizationId) != null")
    public ComplaintResponse get(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        return complaintService.get(organizationId, complaintId);
    }

    @PatchMapping("/{complaintId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public ComplaintResponse update(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId,
            @Valid @RequestBody UpdateComplaintRequest request
    ) {
        return complaintService.update(organizationId, complaintId, request);
    }

    @PostMapping("/{complaintId}/assign")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:assign')")
    public ComplaintResponse assign(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId,
            @Valid @RequestBody AssignComplaintRequest request
    ) {
        return complaintService.assign(organizationId, complaintId, request);
    }

    @PostMapping("/{complaintId}/start")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public ComplaintResponse start(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        return complaintService.start(organizationId, complaintId);
    }

    @PostMapping("/{complaintId}/resolve")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public ComplaintResponse resolve(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        return complaintService.resolve(organizationId, complaintId);
    }

    @PostMapping("/{complaintId}/close")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public ComplaintResponse close(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        return complaintService.close(organizationId, complaintId);
    }

    @PostMapping("/{complaintId}/reopen")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public ComplaintResponse reopen(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        return complaintService.reopen(organizationId, complaintId);
    }

    @PostMapping("/{complaintId}/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.requireMembership(#organizationId) != null")
    public ComplaintAttachmentResponse addAttachment(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId,
            @Valid @RequestBody AddComplaintAttachmentRequest request
    ) {
        return complaintService.addAttachment(organizationId, complaintId, request);
    }

    @DeleteMapping("/{complaintId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'complaint:manage')")
    public void delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID complaintId
    ) {
        complaintService.delete(organizationId, complaintId);
    }
}
