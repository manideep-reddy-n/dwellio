package com.dwellio.membership.dto;

public record StaffInviteResponse(
        String status,
        String message,
        MembershipResponse membership
) {
}
