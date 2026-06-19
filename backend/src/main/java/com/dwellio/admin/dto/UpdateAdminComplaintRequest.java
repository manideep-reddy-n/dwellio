package com.dwellio.admin.dto;

import com.dwellio.domain.enums.ComplaintStatus;
import java.util.UUID;

public record UpdateAdminComplaintRequest(
        ComplaintStatus status,
        UUID assignedToMembershipId
) {
}
