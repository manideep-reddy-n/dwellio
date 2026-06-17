package com.dwellio.payment.event;

import java.util.UUID;

public record PaymentMetricsChangedEvent(UUID organizationId) {
}
