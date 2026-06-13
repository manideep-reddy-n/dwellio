package com.dwellio.complaint.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignComplaintRequest(
        @NotNull UUID assigneeMembershipId
) {
}
