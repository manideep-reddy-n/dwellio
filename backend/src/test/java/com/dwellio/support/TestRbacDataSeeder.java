package com.dwellio.support;

import com.dwellio.common.constants.SystemConstants;
import com.dwellio.common.security.PermissionConstants;
import com.dwellio.domain.entity.Permission;
import com.dwellio.domain.entity.SubscriptionPlan;
import com.dwellio.domain.enums.SubscriptionPlanCode;
import com.dwellio.role.repository.PermissionRepository;
import com.dwellio.organization.repository.SubscriptionPlanRepository;
import jakarta.annotation.PostConstruct;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("test")
@RequiredArgsConstructor
public class TestRbacDataSeeder {

    private final PermissionRepository permissionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @PostConstruct
    void seed() {
        if (permissionRepository.count() == 0) {
            seedPermission("organization:read", "organization", "View organization details");
            seedPermission("organization:update", "organization", "Update organization profile");
            seedPermission("staff:manage", "staff", "Manage staff accounts");
            seedPermission("resident:read", "resident", "View residents");
            seedPermission("resident:manage", "resident", "Manage residents");
            seedPermission("resident:approve", "resident", "Approve join requests");
            seedPermission("building:manage", "building", "Manage buildings and structure");
            seedPermission("complaint:read", "complaint", "View all complaints");
            seedPermission("complaint:manage", "complaint", "Manage complaints");
            seedPermission("complaint:assign", "complaint", "Assign complaints");
            seedPermission("payment:read", "payment", "View all payments");
            seedPermission("payment:manage", "payment", "Manage payments");
            seedPermission("announcement:read", "announcement", "View announcements");
            seedPermission("announcement:manage", "announcement", "Manage announcements");
            seedPermission("asset:read", "asset", "View assets");
            seedPermission("asset:manage", "asset", "Manage assets");
            seedPermission("review:read", "review", "View reviews");
            seedPermission("role:manage", "role", "Manage roles and permissions");
            seedPermission("contact:manage", "contact", "Manage organization contacts");
            seedPermission("dashboard:view", "dashboard", "View organization dashboard");
            seedPermission("verification:manage", "verification", "Submit and manage organization verification");
            seedPermission("verification:review", "verification", "Review organization verification requests");
            for (String code : PermissionConstants.RESIDENT_PERMISSIONS) {
                if (permissionRepository.findByCode(code).isEmpty()) {
                    seedPermission(code, code.split(":")[0], code);
                }
            }
        }

        if (subscriptionPlanRepository.count() == 0) {
            seedPlan(SystemConstants.FREE_PLAN_ID, SubscriptionPlanCode.FREE, "Free Plan");
            seedPlan(SystemConstants.PRO_PLAN_ID, SubscriptionPlanCode.PRO, "Pro Plan");
            seedPlan(SystemConstants.ENTERPRISE_PLAN_ID, SubscriptionPlanCode.ENTERPRISE, "Enterprise Plan");
        }
    }

    private void seedPermission(String code, String module, String description) {
        Permission permission = new Permission();
        permission.setId(UUID.randomUUID());
        permission.setCode(code);
        permission.setModule(module);
        permission.setDescription(description);
        permissionRepository.save(permission);
    }

    private void seedPlan(UUID id, SubscriptionPlanCode code, String name) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setId(id);
        plan.setCode(code);
        plan.setName(name);
        subscriptionPlanRepository.save(plan);
    }
}
