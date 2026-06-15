package com.dwellio.joinrequest.repository;

import com.dwellio.domain.entity.ResidentProfile;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResidentProfileRepository extends JpaRepository<ResidentProfile, UUID> {

    @Query("""
            SELECT rp FROM ResidentProfile rp
            JOIN FETCH rp.membership m
            JOIN FETCH m.organization
            WHERE m.user.id = :userId AND m.organization.slug = :slug
              AND m.status = com.dwellio.domain.enums.MembershipStatus.ACTIVE
            """)
    Optional<ResidentProfile> findActiveByUserIdAndOrganizationSlug(
            @Param("userId") UUID userId,
            @Param("slug") String slug
    );
}
