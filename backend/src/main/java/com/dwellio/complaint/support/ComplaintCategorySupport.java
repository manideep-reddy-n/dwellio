package com.dwellio.complaint.support;

import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.OrganizationType;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public final class ComplaintCategorySupport {

    private static final Set<ComplaintCategory> HOSTEL_STYLE_ONLY = EnumSet.of(
            ComplaintCategory.FOOD,
            ComplaintCategory.HOUSEKEEPING
    );

    private ComplaintCategorySupport() {
    }

    public static List<ComplaintCategory> allowedFor(OrganizationType organizationType) {
        return Arrays.stream(ComplaintCategory.values())
                .filter(category -> isAllowed(organizationType, category))
                .toList();
    }

    public static boolean isAllowed(OrganizationType organizationType, ComplaintCategory category) {
        if (organizationType == OrganizationType.GATED_COMMUNITY) {
            return !HOSTEL_STYLE_ONLY.contains(category);
        }
        return true;
    }
}
