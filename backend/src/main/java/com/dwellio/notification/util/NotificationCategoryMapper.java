package com.dwellio.notification.util;

import com.dwellio.domain.enums.NotificationPreferenceCategory;
import com.dwellio.domain.enums.NotificationType;

public final class NotificationCategoryMapper {

    private NotificationCategoryMapper() {
    }

    public static NotificationPreferenceCategory categoryFor(NotificationType type) {
        return switch (type) {
            case COMPLAINT_CREATED, COMPLAINT_ASSIGNED, COMPLAINT_RESOLVED, COMPLAINT_REOPENED -> NotificationPreferenceCategory.COMPLAINTS;
            case PAYMENT_DUE, PAYMENT_RECORDED, INVOICE_SHARED -> NotificationPreferenceCategory.PAYMENTS;
            case ANNOUNCEMENT_PUBLISHED, FOOD_MENU_UPDATED -> NotificationPreferenceCategory.ANNOUNCEMENTS;
            case REVIEW_REPORTED -> NotificationPreferenceCategory.REVIEWS;
            case JOIN_REQUEST_APPROVED, JOIN_REQUEST_REJECTED, JOIN_REQUEST_SUBMITTED,
                 LEAVE_REQUEST_SUBMITTED, LEAVE_REQUEST_APPROVED, LEAVE_REQUEST_REJECTED,
                 OCCUPANCY_ALLOCATED, OCCUPANCY_TRANSFERRED,
                 ORGANIZATION_VERIFIED, ORGANIZATION_VERIFICATION_SUBMITTED,
                 ORGANIZATION_VERIFICATION_REJECTED, ORGANIZATION_VERIFICATION_MORE_INFO,
                 ORGANIZATION_SUSPENDED, SUSPENSION_APPEAL_SUBMITTED -> NotificationPreferenceCategory.MEMBERSHIP;
            case AVAILABILITY_OPEN, SYSTEM -> NotificationPreferenceCategory.SYSTEM;
        };
    }
}
