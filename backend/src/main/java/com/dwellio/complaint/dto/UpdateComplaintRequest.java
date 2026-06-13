package com.dwellio.complaint.dto;

import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import java.util.UUID;

public record UpdateComplaintRequest(
        ComplaintPriority priority,
        ComplaintCategory category,
        UUID assetId
) {
}
