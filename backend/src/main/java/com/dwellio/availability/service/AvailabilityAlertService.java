package com.dwellio.availability.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.availability.dto.AvailabilityAlertResponse;
import com.dwellio.availability.repository.AvailabilityAlertRepository;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.AvailabilityAlert;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.AvailabilityAlertStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.metrics.event.AvailabilityMetricsUpdatedEvent;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AvailabilityAlertService {

    private final AvailabilityAlertRepository availabilityAlertRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Transactional
    public AvailabilityAlertResponse subscribe(UUID userId, String organizationSlug) {
        Organization organization = organizationRepository.findActiveBySlug(organizationSlug)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        userRepository.findActiveById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        OrganizationMetricsCache metrics = metricsCacheRepository.findById(organization.getId())
                .orElseThrow(() -> new BadRequestException("Availability data is not ready yet"));

        if (!isFull(metrics)) {
            throw new BadRequestException("This property currently has availability — request to join directly");
        }

        AvailabilityAlert alert = availabilityAlertRepository
                .findByUserIdAndOrganizationId(userId, organization.getId())
                .orElseGet(() -> {
                    AvailabilityAlert created = new AvailabilityAlert();
                    created.setId(UUID.randomUUID());
                    created.setUser(userRepository.getReferenceById(userId));
                    created.setOrganization(organization);
                    return created;
                });

        if (alert.getStatus() == AvailabilityAlertStatus.PENDING) {
            throw new ConflictException("You are already subscribed for availability updates");
        }

        alert.setStatus(AvailabilityAlertStatus.PENDING);
        alert.setNotifiedAt(null);
        alert = availabilityAlertRepository.save(alert);
        return toResponse(alert);
    }

    @Transactional
    public void unsubscribe(UUID userId, String organizationSlug) {
        Organization organization = organizationRepository.findActiveBySlug(organizationSlug)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        availabilityAlertRepository.findByUserIdAndOrganizationId(userId, organization.getId())
                .ifPresent(alert -> {
                    alert.setStatus(AvailabilityAlertStatus.CANCELLED);
                    availabilityAlertRepository.save(alert);
                });
    }

    @Transactional(readOnly = true)
    public boolean isSubscribed(UUID userId, String organizationSlug) {
        return organizationRepository.findActiveBySlug(organizationSlug)
                .flatMap(org -> availabilityAlertRepository.findByUserIdAndOrganizationId(userId, org.getId()))
                .map(alert -> alert.getStatus() == AvailabilityAlertStatus.PENDING)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityAlertResponse> listForUser(UUID userId) {
        return availabilityAlertRepository.findActiveByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @EventListener
    @Transactional
    public void onAvailabilityMetricsUpdated(AvailabilityMetricsUpdatedEvent event) {
        if (!hasAvailability(event.availableBeds(), event.availableUnits())) {
            return;
        }

        organizationRepository.findActiveById(event.organizationId()).ifPresent(organization -> {
            for (AvailabilityAlert alert : availabilityAlertRepository.findPendingByOrganizationId(event.organizationId())) {
                notifyAlert(alert, organization);
            }
        });
    }

    private void notifyAlert(AvailabilityAlert alert, Organization organization) {
        if (alert.getStatus() != AvailabilityAlertStatus.PENDING) {
            return;
        }

        notificationService.create(
                alert.getUser().getId(),
                organization.getId(),
                NotificationType.AVAILABILITY_OPEN,
                "Space available",
                "%s now has availability. Request to join when you are ready.".formatted(organization.getName()),
                payload(
                        "organizationId", organization.getId(),
                        "organizationSlug", organization.getSlug()
                )
        );

        alert.setStatus(AvailabilityAlertStatus.NOTIFIED);
        alert.setNotifiedAt(Instant.now(clock));
        availabilityAlertRepository.save(alert);
    }

    private static boolean isFull(OrganizationMetricsCache metrics) {
        if (metrics.getAccommodationMode() == AccommodationMode.BED_BASED) {
            Integer total = metrics.getTotalBeds();
            Integer available = metrics.getAvailableBeds();
            return total != null && total > 0 && available != null && available == 0;
        }
        Integer total = metrics.getTotalUnits();
        Integer available = metrics.getAvailableUnits();
        return total != null && total > 0 && available != null && available == 0;
    }

    private static boolean hasAvailability(Integer availableBeds, Integer availableUnits) {
        if (availableBeds != null) {
            return availableBeds > 0;
        }
        if (availableUnits != null) {
            return availableUnits > 0;
        }
        return false;
    }

    private AvailabilityAlertResponse toResponse(AvailabilityAlert alert) {
        Organization organization = alert.getOrganization();
        return new AvailabilityAlertResponse(
                alert.getId(),
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                alert.getStatus(),
                alert.getCreatedAt(),
                alert.getNotifiedAt()
        );
    }

    private static Map<String, Object> payload(Object... keyValues) {
        Map<String, Object> payload = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            Object value = keyValues[i + 1];
            if (value != null) {
                payload.put((String) keyValues[i], value);
            }
        }
        return payload;
    }
}
