package com.dwellio.auth.repository;

import com.dwellio.domain.entity.PasswordResetToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("""
            SELECT prt FROM PasswordResetToken prt
            WHERE prt.tokenHash = :tokenHash
              AND prt.usedAt IS NULL
              AND prt.expiresAt > CURRENT_TIMESTAMP
            """)
    Optional<PasswordResetToken> findActiveByTokenHash(@Param("tokenHash") String tokenHash);
}
