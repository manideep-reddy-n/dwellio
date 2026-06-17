package com.dwellio.organization.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.constants.SystemConstants;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ConflictException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.PermissionConstants;
import com.dwellio.common.security.RoleConstants;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.domain.entity.Permission;
import com.dwellio.domain.entity.Role;
import com.dwellio.domain.entity.RolePermission;
import com.dwellio.domain.entity.SubscriptionPlan;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.BillingMode;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.OrganizationTypeMapping;
import com.dwellio.domain.enums.SubscriptionPlanCode;
import com.dwellio.organization.dto.CreateOrganizationRequest;
import com.dwellio.organization.dto.OrganizationResponse;
import com.dwellio.organization.dto.UpdateOrganizationRequest;
import com.dwellio.organization.repository.OrganizationMetricsCacheRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.organization.repository.SubscriptionPlanRepository;
import com.dwellio.role.repository.PermissionRepository;
import com.dwellio.role.repository.RolePermissionRepository;
import com.dwellio.role.repository.RoleRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.billing.service.BillingRuleService;
import com.dwellio.metrics.service.MetricsProjectionService;
import java.time.Clock;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationMetricsCacheRepository metricsCacheRepository;
    private final MetricsProjectionService metricsProjectionService;
    private final BillingRuleService billingRuleService;
    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional
    public OrganizationResponse create(UUID creatorUserId, CreateOrganizationRequest request) {
        if (organizationRepository.existsActiveBySlug(request.slug())) {
            throw new ConflictException("Organization slug already exists");
        }

        validateHostelAudience(request.type(), request.hostelAudience());

        SubscriptionPlan freePlan = subscriptionPlanRepository.findByCode(SubscriptionPlanCode.FREE)
                .orElseGet(() -> subscriptionPlanRepository.findById(SystemConstants.FREE_PLAN_ID)
                        .orElseThrow(() -> new NotFoundException("Free plan not found")));

        User creator = userRepository.findActiveById(creatorUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID());
        organization.setSlug(request.slug().toLowerCase());
        organization.setName(request.name().trim());
        organization.setDescription(request.description());
        organization.setType(request.type());
        organization.setHostelAudience(request.hostelAudience());
        organization.setAccommodationMode(OrganizationTypeMapping.defaultAccommodationMode(request.type()));
        organization.setStatus(OrganizationStatus.DRAFT);
        organization.setPlan(freePlan);
        organization.setCity(request.city().trim());
        organization.setArea(request.area());
        organization.setState(request.state());
        organization.setPostalCode(request.postalCode());
        organization.setAddressLine(request.addressLine());
        organization.setContactPhone(request.contactPhone());
        organization.setContactEmail(request.contactEmail());
        applyCoordinates(organization, request.latitude(), request.longitude());
        organization.setProfileCompletenessScore((short) 0);
        organization = organizationRepository.save(organization);

        billingRuleService.seedDefaults(organization);
        organization = organizationRepository.save(organization);

        Role ownerRole = seedSystemRole(organization, RoleConstants.OWNER, true);
        Role residentRole = seedSystemRole(organization, RoleConstants.RESIDENT, false);
        seedResidentPermissions(residentRole);

        Membership ownerMembership = new Membership();
        ownerMembership.setId(UUID.randomUUID());
        ownerMembership.setUser(creator);
        ownerMembership.setOrganization(organization);
        ownerMembership.setRole(ownerRole);
        ownerMembership.setStatus(MembershipStatus.ACTIVE);
        ownerMembership.setJoinedAt(clock.instant());
        membershipRepository.save(ownerMembership);

        seedMetricsCache(organization);

        return toResponse(organization);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getById(UUID organizationId) {
        return toResponse(findActiveOrganization(organizationId));
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getBySlug(String slug) {
        return toResponse(findActiveOrganizationBySlug(slug));
    }

    @Transactional
    public OrganizationResponse update(UUID organizationId, UpdateOrganizationRequest request) {
        Organization organization = findActiveOrganization(organizationId);
        if (request.name() != null) {
            organization.setName(request.name().trim());
        }
        if (request.description() != null) {
            organization.setDescription(request.description());
        }
        if (request.city() != null) {
            organization.setCity(request.city().trim());
        }
        if (request.area() != null) {
            organization.setArea(request.area());
        }
        if (request.state() != null) {
            organization.setState(request.state());
        }
        if (request.postalCode() != null) {
            organization.setPostalCode(request.postalCode());
        }
        if (request.addressLine() != null) {
            organization.setAddressLine(request.addressLine());
        }
        if (request.contactPhone() != null) {
            organization.setContactPhone(request.contactPhone());
        }
        if (request.contactEmail() != null) {
            organization.setContactEmail(request.contactEmail());
        }
        applyCoordinates(organization, request.latitude(), request.longitude());
        if (request.defaultMonthlyRent() != null) {
            organization.setDefaultMonthlyRent(request.defaultMonthlyRent());
        }
        boolean slaChanged = false;
        if (request.slaFirstResponseHours() != null) {
            organization.setSlaFirstResponseHours(request.slaFirstResponseHours());
            slaChanged = true;
        }
        if (request.slaResolutionHours() != null) {
            organization.setSlaResolutionHours(request.slaResolutionHours());
            slaChanged = true;
        }
        boolean billingChanged = false;
        if (request.billingMode() != null) {
            organization.setBillingMode(request.billingMode());
            billingChanged = true;
        }
        if (request.billingCustomDay() != null) {
            organization.setBillingCustomDay(request.billingCustomDay());
            billingChanged = true;
        }
        OrganizationResponse response = toResponse(organization);
        if (slaChanged) {
            metricsProjectionService.refreshComplaintMetrics(organizationId);
        }
        if (billingChanged) {
            metricsProjectionService.refreshRevenueMetrics(organizationId);
        }
        return response;
    }

    @Transactional
    public OrganizationResponse updateLogoUrl(UUID organizationId, String logoUrl) {
        Organization organization = findActiveOrganization(organizationId);
        organization.setLogoUrl(logoUrl);
        return toResponse(organization);
    }

    public Organization findActiveOrganization(UUID organizationId) {
        return organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    public Organization findActiveOrganizationBySlug(String slug) {
        return organizationRepository.findActiveBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    private Role seedSystemRole(Organization organization, String name, boolean ownerRole) {
        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setOrganization(organization);
        role.setName(name);
        role.setSystem(true);
        role.setOwnerRole(ownerRole);
        return roleRepository.save(role);
    }

    private void seedResidentPermissions(Role residentRole) {
        List<Permission> permissions = permissionRepository.findByCodeIn(PermissionConstants.RESIDENT_PERMISSIONS);
        if (permissions.size() != PermissionConstants.RESIDENT_PERMISSIONS.size()) {
            throw new BadRequestException("Resident permission catalog is incomplete");
        }
        for (Permission permission : permissions) {
            RolePermission rolePermission = new RolePermission();
            rolePermission.setRoleId(residentRole.getId());
            rolePermission.setPermissionId(permission.getId());
            rolePermissionRepository.save(rolePermission);
        }
    }

    private void seedMetricsCache(Organization organization) {
        OrganizationMetricsCache cache = new OrganizationMetricsCache();
        cache.setOrganization(organization);
        cache.setAccommodationMode(organization.getAccommodationMode());
        cache.setActiveResidentCount(0);
        cache.setReviewCount(0);
        cache.setOpenComplaintCount(0);
        cache.setRefreshedAt(Instant.now(clock));
        metricsCacheRepository.save(cache);
    }

    static OrganizationResponse toResponse(Organization organization) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                organization.getDescription(),
                organization.getType(),
                organization.getHostelAudience(),
                organization.getAccommodationMode(),
                organization.getStatus(),
                organization.getCity(),
                organization.getArea(),
                organization.getState(),
                organization.getPostalCode(),
                organization.getAddressLine(),
                organization.getLatitude(),
                organization.getLongitude(),
                organization.getContactPhone(),
                organization.getContactEmail(),
                organization.getPlan().getCode().name(),
                organization.getDefaultMonthlyRent(),
                organization.getLogoUrl(),
                organization.getSlaFirstResponseHours(),
                organization.getSlaResolutionHours(),
                organization.getBillingMode(),
                organization.getBillingCustomDay()
        );
    }

    private static void validateHostelAudience(OrganizationType type, HostelAudience audience) {
        boolean hostelLike = type == OrganizationType.HOSTEL || type == OrganizationType.PG;
        if (hostelLike && audience == null) {
            throw new BadRequestException("Hostel audience is required for hostels and PGs (boys, girls, or co-ed)");
        }
        if (!hostelLike && audience != null) {
            throw new BadRequestException("Hostel audience applies only to hostels and PGs");
        }
    }

    private static void applyCoordinates(Organization organization, BigDecimal latitude, BigDecimal longitude) {
        if (latitude != null) {
            organization.setLatitude(latitude);
        }
        if (longitude != null) {
            organization.setLongitude(longitude);
        }
    }
}
