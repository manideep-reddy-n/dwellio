package com.dwellio.activity.service;

import com.dwellio.activity.repository.ActivityEventRepository;
import com.dwellio.domain.entity.ActivityEvent;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.ActivityEventCategory;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityEventRecorder {

    private final ActivityEventRepository activityEventRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final Clock clock;

    @Transactional
    public void record(
            UUID organizationId,
            UUID membershipId,
            ActivityEventCategory category,
            String eventType,
            String title,
            String description,
            Map<String, Object> metadata,
            Instant occurredAt,
            String sourceType,
            UUID sourceId
    ) {
        if (sourceType != null && sourceId != null
                && activityEventRepository.existsByOrganizationIdAndEventTypeAndSourceTypeAndSourceId(
                        organizationId, eventType, sourceType, sourceId)) {
            return;
        }

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
        event.setOccurredAt(occurredAt != null ? occurredAt : Instant.now(clock));
        event.setSourceType(sourceType);
        event.setSourceId(sourceId);
        activityEventRepository.save(event);
    }

    @Transactional
    public void recordNow(
            UUID organizationId,
            UUID membershipId,
            ActivityEventCategory category,
            String eventType,
            String title,
            String description,
            Map<String, Object> metadata,
            String sourceType,
            UUID sourceId
    ) {
        record(organizationId, membershipId, category, eventType, title, description, metadata,
                Instant.now(clock), sourceType, sourceId);
    }
}
