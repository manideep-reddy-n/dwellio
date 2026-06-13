package com.dwellio.membership.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StaffInviteRequest(
        @NotBlank @Email String email,
        @NotNull UUID roleId
) {
}
