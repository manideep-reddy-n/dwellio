package com.dwellio.audit.repository;

import com.dwellio.domain.entity.AuditLog;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            SELECT a FROM AuditLog a
            JOIN FETCH a.actorUser
            LEFT JOIN FETCH a.organization
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findAllOrderByCreatedAtDesc(Pageable pageable);
}
