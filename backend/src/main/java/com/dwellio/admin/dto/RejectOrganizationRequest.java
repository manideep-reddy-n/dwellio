package com.dwellio.admin.dto;

import jakarta.validation.constraints.Size;

public record RejectOrganizationRequest(
        @Size(max = 2000) String reason
) {
}
