package com.dwellio.review.event;

import java.util.UUID;

public record ReviewMetricsChangedEvent(UUID organizationId) {
}
