package com.dwellio.metrics.event;

import java.util.UUID;

public record MembershipActivatedEvent(UUID organizationId, UUID membershipId, UUID userId) {
}
