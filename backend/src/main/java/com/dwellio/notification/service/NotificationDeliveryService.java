package com.dwellio.notification.service;

import com.dwellio.notification.dto.NotificationResponse;
import com.dwellio.notification.event.AnnouncementPublishedEvent;
import com.dwellio.notification.event.NotificationCreatedEvent;
import com.dwellio.notification.repository.NotificationRepository;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDeliveryService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    @EventListener
    public void deliverNotification(NotificationCreatedEvent event) {
        try {
            NotificationResponse payload = NotificationResponse.from(
                    notificationRepository.findByIdWithDetails(event.notificationId()).orElseThrow()
            );
            messagingTemplate.convertAndSendToUser(
                    payload.userId().toString(),
                    "/queue/notifications",
                    payload
            );
        } catch (Exception ex) {
            log.error("Failed to deliver notification {} over WebSocket", event.notificationId(), ex);
        }
    }

    public void broadcastAnnouncement(AnnouncementPublishedEvent event) {
        try {
            messagingTemplate.convertAndSend(
                    orgTopic(event.organizationId()),
                    Map.of(
                            "organizationId", event.organizationId(),
                            "announcementId", event.announcementId(),
                            "title", event.title(),
                            "type", "ANNOUNCEMENT_PUBLISHED"
                    )
            );
        } catch (Exception ex) {
            log.error("Failed to broadcast announcement {} for organization {}",
                    event.announcementId(), event.organizationId(), ex);
        }
    }

    static String orgTopic(UUID organizationId) {
        return "/topic/org/" + organizationId + "/announcements";
    }
}
