package com.dwellio.common.constants;

import java.util.UUID;

public final class SystemConstants {

    private SystemConstants() {
    }

    public static final UUID FREE_PLAN_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID PRO_PLAN_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");
    public static final UUID ENTERPRISE_PLAN_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000003");
}
