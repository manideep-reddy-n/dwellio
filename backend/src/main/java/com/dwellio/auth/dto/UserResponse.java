package com.dwellio.auth.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        boolean platformAdmin,
        boolean emailVerified
) {
}
