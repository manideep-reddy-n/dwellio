package com.dwellio.role.dto;

import java.util.List;
import java.util.UUID;

public record RoleResponse(
        UUID id,
        String name,
        boolean system,
        boolean ownerRole,
        List<String> permissions
) {
}
