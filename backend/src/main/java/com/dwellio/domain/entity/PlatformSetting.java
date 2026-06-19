package com.dwellio.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "platform_settings")
@Getter
@Setter
public class PlatformSetting {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(nullable = false, length = 50)
    private String category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value_json", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> valueJson;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}
