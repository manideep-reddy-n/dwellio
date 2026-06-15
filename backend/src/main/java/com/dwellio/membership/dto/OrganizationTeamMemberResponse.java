package com.dwellio.membership.dto;

public record OrganizationTeamMemberResponse(
        String fullName,
        String roleName,
        String email,
        String phone,
        boolean ownerRole
) {
}
