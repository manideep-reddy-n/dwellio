package com.dwellio.domain.entity;

import com.dwellio.common.entity.SoftDeletableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "push_subscriptions")
@Getter
@Setter
public class PushSubscription extends SoftDeletableEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false)
    private String p256dh;

    @Column(name = "auth_key", nullable = false)
    private String authKey;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;
}
