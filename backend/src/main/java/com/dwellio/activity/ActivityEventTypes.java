package com.dwellio.activity;

public final class ActivityEventTypes {

    private ActivityEventTypes() {
    }

    public static final String MEMBERSHIP_APPROVED = "MEMBERSHIP_APPROVED";
    public static final String MEMBERSHIP_JOINED = "MEMBERSHIP_JOINED";
    public static final String MEMBERSHIP_LEFT = "MEMBERSHIP_LEFT";

    public static final String OCCUPANCY_ALLOCATED = "OCCUPANCY_ALLOCATED";
    public static final String OCCUPANCY_RELEASED = "OCCUPANCY_RELEASED";
    public static final String OCCUPANCY_TRANSFERRED = "OCCUPANCY_TRANSFERRED";
    public static final String BED_CHANGED = "BED_CHANGED";
    public static final String ROOM_CHANGED = "ROOM_CHANGED";

    public static final String COMPLAINT_CREATED = "COMPLAINT_CREATED";
    public static final String COMPLAINT_ASSIGNED = "COMPLAINT_ASSIGNED";
    public static final String COMPLAINT_RESOLVED = "COMPLAINT_RESOLVED";
    public static final String COMPLAINT_REOPENED = "COMPLAINT_REOPENED";
    public static final String COMPLAINT_CLOSED = "COMPLAINT_CLOSED";

    public static final String CHARGE_GENERATED = "CHARGE_GENERATED";
    public static final String PAYMENT_RECEIVED = "PAYMENT_RECEIVED";
    public static final String LATE_FEE_APPLIED = "LATE_FEE_APPLIED";
    public static final String ADJUSTMENT_APPLIED = "ADJUSTMENT_APPLIED";

    public static final String REVIEW_SUBMITTED = "REVIEW_SUBMITTED";
    public static final String REVIEW_UPDATED = "REVIEW_UPDATED";
}
