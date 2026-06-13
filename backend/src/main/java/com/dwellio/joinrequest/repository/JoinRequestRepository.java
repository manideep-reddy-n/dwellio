package com.dwellio.joinrequest.repository;

import com.dwellio.domain.entity.JoinRequest;
import com.dwellio.domain.enums.JoinRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, UUID> {

    @Query("""
            SELECT jr FROM JoinRequest jr
            JOIN FETCH jr.user u
            WHERE jr.id = :id AND jr.organization.id = :organizationId
            """)
    Optional<JoinRequest> findByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT jr FROM JoinRequest jr
            JOIN FETCH jr.user u
            WHERE jr.organization.id = :organizationId
            ORDER BY jr.createdAt DESC
            """)
    List<JoinRequest> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT COUNT(jr) > 0 FROM JoinRequest jr
            WHERE jr.user.id = :userId
              AND jr.organization.id = :organizationId
              AND jr.status = 'PENDING'
            """)
    boolean existsPendingByUserIdAndOrganizationId(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId
    );

    @Query("""
            SELECT jr FROM JoinRequest jr
            WHERE jr.user.id = :userId
              AND jr.organization.id = :organizationId
              AND jr.status = :status
            """)
    Optional<JoinRequest> findByUserIdAndOrganizationIdAndStatus(
            @Param("userId") UUID userId,
            @Param("organizationId") UUID organizationId,
            @Param("status") JoinRequestStatus status
    );
}
