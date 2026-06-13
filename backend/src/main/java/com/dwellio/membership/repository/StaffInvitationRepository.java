package com.dwellio.membership.repository;

import com.dwellio.domain.entity.StaffInvitation;
import com.dwellio.domain.enums.StaffInvitationStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StaffInvitationRepository extends JpaRepository<StaffInvitation, UUID> {

    @Query("""
            SELECT si FROM StaffInvitation si
            WHERE si.organization.id = :organizationId
              AND si.email = :email
              AND si.status = :status
            """)
    Optional<StaffInvitation> findByOrganizationIdAndEmailAndStatus(
            @Param("organizationId") UUID organizationId,
            @Param("email") String email,
            @Param("status") StaffInvitationStatus status
    );
}
