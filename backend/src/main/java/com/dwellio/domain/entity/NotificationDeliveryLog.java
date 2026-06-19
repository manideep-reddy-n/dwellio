package com.dwellio.domain.entity;

import com.dwellio.common.entity.CreatedTimestampEntity;
import com.dwellio.domain.enums.NotificationDeliveryChannel;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notification_delivery_log")
@Getter
@Setter
public class NotificationDeliveryLog extends CreatedTimestampEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id")
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationDeliveryChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationDeliveryStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
