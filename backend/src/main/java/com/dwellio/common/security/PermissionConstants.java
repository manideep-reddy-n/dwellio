package com.dwellio.common.security;

import java.util.List;

public final class PermissionConstants {

    public static final List<String> RESIDENT_PERMISSIONS = List.of(
            "announcement:read_own",
            "complaint:create",
            "complaint:read_own",
            "payment:read_own",
            "review:create",
            "review:update_own",
            "allocation:read_own",
            "notification:read"
    );

    private PermissionConstants() {
    }
}
