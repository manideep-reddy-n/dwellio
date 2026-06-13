package com.dwellio.auth.service;

import com.dwellio.auth.config.JwtProperties;
import com.dwellio.auth.dto.MessageResponse;
import com.dwellio.auth.repository.PasswordResetTokenRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.auth.security.TokenHasher;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.domain.entity.PasswordResetToken;
import com.dwellio.domain.entity.User;
import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String GENERIC_MESSAGE =
            "If an account exists for that email, password reset instructions have been sent.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProperties jwtProperties;
    private final Clock clock;

    @Transactional
    public MessageResponse requestReset(String email) {
        userRepository.findActiveByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            String rawToken = TokenHasher.generateRawToken();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setId(UUID.randomUUID());
            resetToken.setUser(user);
            resetToken.setTokenHash(TokenHasher.hash(rawToken));
            resetToken.setExpiresAt(clock.instant().plus(jwtProperties.getPasswordResetExpiration()));
            passwordResetTokenRepository.save(resetToken);

            log.info("Password reset token generated for user {}: {}", user.getEmail(), rawToken);
        });

        return new MessageResponse(GENERIC_MESSAGE);
    }

    @Transactional
    public MessageResponse resetPassword(String rawToken, String newPassword) {
        String tokenHash = TokenHasher.hash(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findActiveByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(clock.instant());
        passwordResetTokenRepository.save(resetToken);

        return new MessageResponse("Password has been reset successfully");
    }
}
