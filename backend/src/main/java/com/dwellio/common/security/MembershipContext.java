package com.dwellio.common.security;

import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Role;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;

@Getter
public class MembershipContext {

    private final UUID membershipId;
    private final UUID organizationId;
    private final UUID userId;
    private final Role role;
    private final boolean owner;
    private final Set<String> permissions;

    public MembershipContext(
            Membership membership,
            boolean owner,
            Set<String> permissions
    ) {
        this.membershipId = membership.getId();
        this.organizationId = membership.getOrganization().getId();
        this.userId = membership.getUser().getId();
        this.role = membership.getRole();
        this.owner = owner;
        this.permissions = permissions;
    }

    public boolean hasPermission(String permission) {
        return owner || permissions.contains(permission);
    }
}
