package com.dwellio.auth.repository;

import com.dwellio.domain.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<User> findActiveByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findActiveById(@Param("id") UUID id);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsActiveByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.platformAdmin = true AND u.deletedAt IS NULL")
    List<User> findActivePlatformAdmins();

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(u) FROM User u")
    long countAllIncludingDeleted();

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countCreatedSince(@Param("since") Instant since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :start AND u.createdAt < :end")
    long countCreatedBetween(
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("""
            SELECT u FROM User u
            WHERE (:query IS NULL OR :query = ''
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY u.createdAt DESC
            """)
    Page<User> searchForAdmin(@Param("query") String query, Pageable pageable);
}
