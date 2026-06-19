package com.dwellio.push.service;

import com.dwellio.domain.entity.PushSubscription;
import com.dwellio.domain.enums.NotificationDeliveryChannel;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import com.dwellio.domain.enums.NotificationPreferenceCategory;
import com.dwellio.notification.event.NotificationCreatedEvent;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.notification.service.NotificationDeliveryLogService;
import com.dwellio.notification.service.NotificationPreferenceService;
import com.dwellio.notification.util.NotificationCategoryMapper;
import com.dwellio.platform.service.PlatformConfigService;
import com.dwellio.push.config.PushProperties;
import com.dwellio.push.repository.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.jose4j.lang.JoseException;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushDeliveryService {

    private final PushProperties pushProperties;
    private final PushSubscriptionService pushSubscriptionService;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;
    private final PlatformConfigService platformConfigService;
    private final NotificationDeliveryLogService deliveryLogService;
    private final ObjectMapper objectMapper;

    @EventListener
    public void deliverPush(NotificationCreatedEvent event) {
        if (!platformConfigService.isEnabled("notifications.push.enabled", "enabled", true)) {
            return;
        }

        com.dwellio.domain.entity.Notification notification = notificationRepository.findByIdWithDetails(event.notificationId())
                .orElse(null);
        if (notification == null) {
            return;
        }

        NotificationPreferenceCategory category = NotificationCategoryMapper.categoryFor(notification.getType());
        if (!preferenceService.isPushEnabledForUser(notification.getUser().getId(), category)) {
            deliveryLogService.log(
                    notification,
                    notification.getUser(),
                    NotificationDeliveryChannel.PUSH,
                    NotificationDeliveryStatus.DISABLED,
                    "User preference disabled"
            );
            return;
        }

        if (!pushProperties.isConfigured()) {
            deliveryLogService.log(
                    notification,
                    notification.getUser(),
                    NotificationDeliveryChannel.PUSH,
                    NotificationDeliveryStatus.SKIPPED,
                    "VAPID keys not configured"
            );
            return;
        }

        List<PushSubscription> subscriptions = pushSubscriptionService.findActiveForUser(notification.getUser().getId());
        if (subscriptions.isEmpty()) {
            deliveryLogService.log(
                    notification,
                    notification.getUser(),
                    NotificationDeliveryChannel.PUSH,
                    NotificationDeliveryStatus.SKIPPED,
                    "No push subscriptions"
            );
            return;
        }

        String payload = buildPayload(notification);
        PushService pushService = buildPushService();

        for (PushSubscription subscription : subscriptions) {
            try {
                Subscription keys = new Subscription(
                        subscription.getEndpoint(),
                        new Subscription.Keys(subscription.getP256dh(), subscription.getAuthKey())
                );
                pushService.send(new nl.martijndwars.webpush.Notification(keys, payload));
                subscription.setLastUsedAt(Instant.now());
                pushSubscriptionRepository.save(subscription);
                deliveryLogService.log(
                        notification,
                        notification.getUser(),
                        NotificationDeliveryChannel.PUSH,
                        NotificationDeliveryStatus.SENT,
                        null
                );
            } catch (GeneralSecurityException | JoseException | java.io.IOException
                    | java.util.concurrent.ExecutionException | InterruptedException ex) {
                log.warn("Push delivery failed for subscription {}", subscription.getId(), ex);
                deliveryLogService.log(
                        notification,
                        notification.getUser(),
                        NotificationDeliveryChannel.PUSH,
                        NotificationDeliveryStatus.FAILED,
                        ex.getMessage()
                );
            }
        }
    }

    private PushService buildPushService() {
        try {
            PushService pushService = new PushService();
            pushService.setPublicKey(pushProperties.vapidPublicKey());
            pushService.setPrivateKey(pushProperties.vapidPrivateKey());
            pushService.setSubject(pushProperties.subject() != null ? pushProperties.subject() : "mailto:admin@dwellio.local");
            return pushService;
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Invalid VAPID configuration", ex);
        }
    }

    private String buildPayload(com.dwellio.domain.entity.Notification notification) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", notification.getTitle());
            payload.put("body", notification.getBody());
            payload.put("type", notification.getType().name());
            if (notification.getPayloadJson() != null) {
                payload.put("data", notification.getPayloadJson());
            }
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return "{\"title\":\"" + notification.getTitle() + "\"}";
        }
    }
}
