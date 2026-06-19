package com.dwellio.review.repository;

import com.dwellio.domain.entity.Review;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            JOIN FETCH r.membership m
            JOIN FETCH m.user u
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

    @Query("SELECT COUNT(r) FROM Review r WHERE r.deletedAt IS NULL")
    long countActive();

    @Query("""
            SELECT r FROM Review r
            JOIN FETCH r.organization o
            JOIN FETCH r.membership m
            JOIN FETCH m.user u
            WHERE (:includeHidden = TRUE OR r.deletedAt IS NULL)
              AND (:query IS NULL OR :query = ''
                OR LOWER(COALESCE(r.body, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(o.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY r.createdAt DESC
            """)
    Page<Review> searchForAdmin(
            @Param("query") String query,
            @Param("includeHidden") boolean includeHidden,
            Pageable pageable
    );

    @Query("""
            SELECT r FROM Review r
            JOIN FETCH r.organization
            JOIN FETCH r.membership m
            JOIN FETCH m.user
            WHERE r.id = :reviewId
            """)
    Optional<Review> findByIdForAdmin(@Param("reviewId") UUID reviewId);
}
