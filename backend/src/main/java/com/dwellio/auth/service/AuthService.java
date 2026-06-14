package com.dwellio.auth.service;

import com.dwellio.auth.config.JwtProperties;
import com.dwellio.auth.dto.AdminLoginRequest;
import com.dwellio.auth.dto.AuthResponse;
import com.dwellio.auth.dto.LoginRequest;
import com.dwellio.auth.dto.RegisterRequest;
import com.dwellio.auth.dto.UserResponse;
import com.dwellio.auth.repository.RefreshTokenRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.auth.security.JwtService;
import com.dwellio.auth.security.TokenHasher;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.UnauthorizedException;
import com.dwellio.domain.entity.RefreshToken;
import com.dwellio.domain.entity.User;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final Clock clock;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsActiveByEmail(request.email())) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhone(request.phone());
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPlatformAdmin(false);
        user.setEmailVerified(false);

        User saved = userRepository.save(user);
        return issueTokens(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        return authenticate(request.email().trim().toLowerCase(), request.password());
    }

    @Transactional
    public AuthResponse adminLogin(AdminLoginRequest request) {
        String username = request.username().trim().toLowerCase();
        String email = resolveAdminEmail(username);
        AuthResponse response = authenticate(email, request.password());
        if (!response.user().platformAdmin()) {
            throw new UnauthorizedException("Not a platform administrator");
        }
        return response;
    }

    private AuthResponse authenticate(String email, String password) {
        User user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        refreshTokenRepository.revokeAllForUser(user.getId(), clock.instant());
        return issueTokens(user);
    }

    private static String resolveAdminEmail(String username) {
        if ("admin".equals(username)) {
            return "admin@dwellio.local";
        }
        if (username.contains("@")) {
            return username;
        }
        return username + "@dwellio.local";
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String tokenHash = TokenHasher.hash(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findActiveByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = refreshToken.getUser();
        refreshToken.setRevokedAt(clock.instant());
        refreshTokenRepository.save(refreshToken);

        return issueTokens(user);
    }

    @Transactional
    public void logout(UserPrincipal principal) {
        refreshTokenRepository.revokeAllForUser(principal.getId(), clock.instant());
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findActiveById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return toUserResponse(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.isPlatformAdmin());
        String rawRefreshToken = TokenHasher.generateRawToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UUID.randomUUID());
        refreshToken.setUser(user);
        refreshToken.setTokenHash(TokenHasher.hash(rawRefreshToken));
        refreshToken.setExpiresAt(clock.instant().plus(jwtProperties.getRefreshTokenExpiration()));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                jwtProperties.getAccessTokenExpiration().toSeconds(),
                toUserResponse(user)
        );
    }

    static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.isPlatformAdmin(),
                user.isEmailVerified()
        );
    }
}
