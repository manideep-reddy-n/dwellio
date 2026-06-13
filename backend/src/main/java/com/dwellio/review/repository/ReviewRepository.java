package com.dwellio.review.repository;

import com.dwellio.domain.entity.Review;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("""
            SELECT r FROM Review r
            JOIN FETCH r.membership m
            JOIN FETCH m.user u
            WHERE r.organization.id = :organizationId
              AND r.deletedAt IS NULL
            ORDER BY r.createdAt DESC
            """)
    List<Review> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT r FROM Review r
            WHERE r.organization.id = :organizationId
              AND r.membership.id = :membershipId
              AND r.deletedAt IS NULL
            """)
    Optional<Review> findActiveByOrganizationIdAndMembershipId(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId
    );

    @Query("""
            SELECT r FROM Review r
            WHERE r.id = :reviewId
              AND r.organization.id = :organizationId
              AND r.deletedAt IS NULL
            """)
    Optional<Review> findActiveByIdAndOrganizationId(
            @Param("reviewId") UUID reviewId,
            @Param("organizationId") UUID organizationId
    );

    boolean existsByMembershipIdAndDeletedAtIsNull(UUID membershipId);
}
