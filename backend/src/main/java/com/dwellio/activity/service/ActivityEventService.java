package com.dwellio.activity.service;

import com.dwellio.activity.dto.ActivityEventResponse;
import com.dwellio.activity.repository.ActivityEventRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.ActivityEvent;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityEventService {

    private final ActivityEventRepository activityEventRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    @Transactional
    public void record(
            UUID organizationId,
            UUID membershipId,
            ActivityEventCategory category,
            String eventType,
            String title,
            String description,
            Map<String, Object> metadata
    ) {
        recordAt(organizationId, membershipId, category, eventType, title, description, metadata, Instant.now(clock));
    }

    @Transactional
    public void recordAt(
            UUID organizationId,
            UUID membershipId,
            ActivityEventCategory category,
            String eventType,
            String title,
            String description,
            Map<String, Object> metadata,
            Instant occurredAt
    ) {
        Organization organization = organizationRepository.getReferenceById(organizationId);
        Membership membership = membershipId != null
                ? membershipRepository.getReferenceById(membershipId)
                : null;

        ActivityEvent event = new ActivityEvent();
        event.setId(UUID.randomUUID());
        event.setOrganization(organization);
        event.setMembership(membership);
        event.setEventCategory(category);
        event.setEventType(eventType);
        event.setTitle(title);
        event.setDescription(description);
        event.setMetadata(metadata != null ? metadata : new HashMap<>());
        event.setOccurredAt(occurredAt);
        activityEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> listForOrganization(UUID organizationId, UUID membershipId) {
        authorizationService.requirePermission(organizationId, "resident:manage");
        List<ActivityEvent> events = membershipId != null
                ? activityEventRepository.findByOrganizationAndMembership(organizationId, membershipId)
                : activityEventRepository.findByOrganization(organizationId);
        return events.stream().map(ActivityEventResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityEventResponse> listMine(UUID organizationId) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "allocation:read_own");
        return activityEventRepository
                .findByOrganizationAndMembership(organizationId, context.getMembershipId())
                .stream()
                .map(ActivityEventResponse::from)
                .toList();
    }
}
