package com.dwellio.audit.service;

import com.dwellio.audit.repository.AuditLogRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.AuditLog;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.User;
import com.dwellio.organization.repository.OrganizationRepository;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformAuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthorizationService authorizationService;

    @Transactional
    public void record(
            UUID actorUserId,
            String action,
            String entityType,
            UUID entityId,
            UUID organizationId,
            Map<String, Object> metadata
    ) {
        User actor = userRepository.findActiveById(actorUserId).orElse(null);
        if (actor == null) {
            return;
        }

        AuditLog log = new AuditLog();
        log.setId(UUID.randomUUID());
        log.setActorUser(actor);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        if (organizationId != null) {
            Organization organization = organizationRepository.findActiveById(organizationId).orElse(null);
            log.setOrganization(organization);
        }
        log.setMetadata(metadata);
        auditLogRepository.save(log);
    }

    @Transactional
    public void recordForCurrentUser(
            String action,
            String entityType,
            UUID entityId,
            UUID organizationId,
            Object previousValue,
            Object newValue
    ) {
        if (!authorizationService.isPlatformAdmin()) {
            return;
        }
        record(
                authorizationService.currentPrincipal().getId(),
                action,
                entityType,
                entityId,
                organizationId,
                Map.of(
                        "previousValue", previousValue != null ? previousValue : "",
                        "newValue", newValue != null ? newValue : ""
                )
        );
    }
}
