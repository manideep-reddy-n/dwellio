package com.dwellio.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateRoleRequest(
        @Size(max = 100) String name,
        List<@NotBlank @Size(max = 100) String> permissions
) {
}
