package com.dwellio.domain.entity;

import com.dwellio.common.entity.CreatedTimestampEntity;
import com.dwellio.domain.enums.DocumentType;
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
@Table(name = "join_request_documents")
@Getter
@Setter
public class JoinRequestDocument extends CreatedTimestampEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "join_request_id", nullable = false)
    private JoinRequest joinRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private DocumentType documentType;

    @Column(name = "custom_label", length = 100)
    private String customLabel;

    @Column(name = "cloudinary_url", nullable = false, length = 500)
    private String cloudinaryUrl;
}
