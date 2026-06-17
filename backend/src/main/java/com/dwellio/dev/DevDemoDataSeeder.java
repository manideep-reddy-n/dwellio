package com.dwellio.dev;

import com.dwellio.announcement.repository.AnnouncementRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.bed.dto.CreateBedRequest;
import com.dwellio.bed.service.BedService;
import com.dwellio.building.dto.CreateBuildingRequest;
import com.dwellio.building.service.BuildingService;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.Announcement;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Review;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.AnnouncementType;
import com.dwellio.domain.enums.ComplaintCategory;
import com.dwellio.domain.enums.ComplaintPriority;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.MealType;
import com.dwellio.domain.enums.MembershipStatus;
import com.dwellio.domain.enums.NotificationStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.floor.dto.CreateFloorRequest;
import com.dwellio.floor.service.FloorService;
import com.dwellio.membership.dto.StaffInviteRequest;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.membership.service.MembershipService;
import com.dwellio.metrics.service.MetricsProjectionService;
import com.dwellio.notification.repository.NotificationRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.occupancy.dto.AllocateOccupancyRequest;
import com.dwellio.occupancy.service.OccupancyService;
import com.dwellio.organization.dto.CreateOrganizationRequest;
import java.math.BigDecimal;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.organization.service.OrganizationService;
import com.dwellio.review.repository.ReviewRepository;
import com.dwellio.role.dto.CreateRoleRequest;
import com.dwellio.role.repository.RoleRepository;
import com.dwellio.role.service.RoleService;
import com.dwellio.space.dto.CreateSpaceRequest;
import com.dwellio.space.service.SpaceService;
import com.dwellio.common.security.RoleConstants;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Idempotent local demo dataset for development.
 * Password for all demo users: Password123!
 */
@Component
@Profile("!test")
@ConditionalOnProperty(name = "dwellio.dev.seed-demo-data", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DevDemoDataSeeder {

    public static final String DEMO_PASSWORD = "Password123!";
    public static final String OWNER_EMAIL = "owner@example.com";
    public static final String STAFF_EMAIL = "staff@example.com";
    public static final String RESIDENT_EMAIL = "resident@example.com";
    public static final String PLATFORM_ADMIN_EMAIL = "platform-admin@example.com";
    public static final String ADMIN_CONSOLE_EMAIL = "admin@dwellio.local";
    public static final String ADMIN_CONSOLE_PASSWORD = "12345678";
    public static final String HOSTEL_SLUG = "sunrise-hostel";
    public static final String GATED_SLUG = "green-valley-residences";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final RoleService roleService;
    private final MembershipRepository membershipRepository;
    private final MembershipService membershipService;
    private final BuildingService buildingService;
    private final FloorService floorService;
    private final SpaceService spaceService;
    private final BedService bedService;
    private final OccupancyService occupancyService;
    private final ComplaintRepository complaintRepository;
    private final AnnouncementRepository announcementRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final MetricsProjectionService metricsProjectionService;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    private record SeedContext(UUID hostelId, UUID gatedId, UUID residentUserId) {
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDemoData() {
        try {
            if (organizationRepository.findActiveBySlug(HOSTEL_SLUG).isPresent()) {
                backfillNotificationsIfMissing();
                backfillMapCoordinatesIfMissing();
                ensureAdminConsoleUser();
                log.info("Demo data already present — skipping full seed");
                return;
            }

            log.info("Seeding Dwellio demo dataset…");

            SeedContext context = transactionTemplate.execute(status -> seedCoreData());
            if (context == null) {
                log.warn("Demo seed transaction returned no context — skipping notifications");
                return;
            }

            seedNotificationsSafe(context.residentUserId(), context.hostelId());

            log.info(
                    "Demo data ready. Log in with owner@ / staff@ / resident@ / platform-admin@example.com — password: {}",
                    DEMO_PASSWORD
            );
            log.info("Organizations: {} (hostel), {} (gated community)", HOSTEL_SLUG, GATED_SLUG);
        } catch (Exception exception) {
            log.error(
                    "Demo data seeding failed — application will continue without demo dataset: {}",
                    exception.getMessage(),
                    exception
            );
        }
    }

    /**
     * Core demo entities (users → orgs → memberships → ops data). Commits before notifications.
     */
    private SeedContext seedCoreData() {
        createUser(PLATFORM_ADMIN_EMAIL, "Platform Admin", true, DEMO_PASSWORD);
        createUser(ADMIN_CONSOLE_EMAIL, "Dwellio Admin", true, ADMIN_CONSOLE_PASSWORD);
        User owner = createUser(OWNER_EMAIL, "Demo Owner", false, DEMO_PASSWORD);
        User staff = createUser(STAFF_EMAIL, "Demo Staff", false, DEMO_PASSWORD);
        User resident = createUser(RESIDENT_EMAIL, "Demo Resident", false, DEMO_PASSWORD);

        UUID hostelId = createHostelOrganization(owner);
        UUID gatedId = createGatedOrganization(owner);

        seedMarketplaceExtras(hostelId);
        seedMarketplaceExtras(gatedId);

        Membership staffMembership = seedStaff(hostelId, owner, staff);
        Membership residentMembership = seedResident(hostelId, resident);

        seedHostelAccommodation(hostelId, residentMembership.getId());
        seedGatedAccommodation(gatedId);
        seedComplaints(hostelId, residentMembership, staffMembership);
        seedAnnouncements(hostelId, owner);
        seedFoodMenu(hostelId);
        seedReview(hostelId, residentMembership);

        metricsProjectionService.rebuild(hostelId);
        metricsProjectionService.rebuild(gatedId);

        return new SeedContext(hostelId, gatedId, resident.getId());
    }

    /**
     * Notifications use {@code REQUIRES_NEW} in {@link NotificationService#create} and must run
     * after the core seed transaction has committed so user/org rows are visible.
     */
    private void backfillNotificationsIfMissing() {
        userRepository.findActiveByEmail(RESIDENT_EMAIL).ifPresent(resident ->
                organizationRepository.findActiveBySlug(HOSTEL_SLUG).ifPresent(org -> {
                    long existing = notificationRepository.countByUserIdAndStatus(
                            resident.getId(),
                            NotificationStatus.UNREAD
                    ) + notificationRepository.countByUserIdAndStatus(
                            resident.getId(),
                            NotificationStatus.READ
                    );
                    if (existing == 0) {
                        log.info("Backfilling demo notifications for resident@example.com");
                        seedNotificationsSafe(resident.getId(), org.getId());
                    }
                })
        );
    }

    private void backfillMapCoordinatesIfMissing() {
        organizationRepository.findActiveBySlug(HOSTEL_SLUG).ifPresent(org -> {
            if (org.getLatitude() == null || org.getLongitude() == null) {
                org.setLatitude(new BigDecimal("17.448294"));
                org.setLongitude(new BigDecimal("78.391487"));
                organizationRepository.save(org);
                log.info("Backfilled map coordinates for {}", HOSTEL_SLUG);
            }
        });
        organizationRepository.findActiveBySlug(GATED_SLUG).ifPresent(org -> {
            if (org.getLatitude() == null || org.getLongitude() == null) {
                org.setLatitude(new BigDecimal("17.440081"));
                org.setLongitude(new BigDecimal("78.348912"));
                organizationRepository.save(org);
                log.info("Backfilled map coordinates for {}", GATED_SLUG);
            }
        });
    }

    private void seedNotificationsSafe(UUID residentUserId, UUID organizationId) {
        User resident = userRepository.findActiveById(residentUserId).orElse(null);
        if (resident == null) {
            log.warn(
                    "Skipping demo notifications — recipient user {} not found (expected resident@example.com)",
                    residentUserId
            );
            return;
        }

        if (organizationRepository.findActiveById(organizationId).isEmpty()) {
            log.warn("Skipping demo notifications — organization {} not found", organizationId);
            return;
        }

        createNotificationSafe(
                resident.getId(),
                organizationId,
                NotificationType.COMPLAINT_ASSIGNED,
                "Complaint assigned",
                "Your AC complaint has been assigned to operations."
        );
        createNotificationSafe(
                resident.getId(),
                organizationId,
                NotificationType.ANNOUNCEMENT_PUBLISHED,
                "New announcement",
                "Community movie night this Friday."
        );
        createNotificationSafe(
                resident.getId(),
                organizationId,
                NotificationType.COMPLAINT_RESOLVED,
                "Complaint resolved",
                "Your plumbing complaint has been marked resolved."
        );
    }

    private void createNotificationSafe(
            UUID userId,
            UUID organizationId,
            NotificationType type,
            String title,
            String body
    ) {
        try {
            notificationService.create(
                    userId,
                    organizationId,
                    type,
                    title,
                    body,
                    Map.of("organizationSlug", HOSTEL_SLUG)
            );
        } catch (Exception exception) {
            log.warn(
                    "Failed to create demo notification '{}' for user {}: {}",
                    title,
                    userId,
                    exception.getMessage()
            );
        }
    }

    private void ensureAdminConsoleUser() {
        userRepository.findActiveByEmail(ADMIN_CONSOLE_EMAIL).ifPresentOrElse(
                user -> {
                    if (!user.isPlatformAdmin()) {
                        user.setPlatformAdmin(true);
                        userRepository.save(user);
                    }
                },
                () -> {
                    log.info("Seeding admin console user (username: admin)");
                    createUser(ADMIN_CONSOLE_EMAIL, "Dwellio Admin", true, ADMIN_CONSOLE_PASSWORD);
                }
        );
    }

    private User createUser(String email, String fullName, boolean platformAdmin, String password) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setPlatformAdmin(platformAdmin);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private UUID createHostelOrganization(User owner) {
        var response = organizationService.create(owner.getId(), new CreateOrganizationRequest(
                "Sunrise Hostel",
                HOSTEL_SLUG,
                OrganizationType.HOSTEL,
                HostelAudience.CO_ED,
                "A verified demo hostel in Madhapur with beds, operations data, and resident workflows.",
                "Hyderabad",
                "Madhapur",
                "Telangana",
                "500081",
                "12 Tech Park Road",
                new BigDecimal("17.448294"),
                new BigDecimal("78.391487"),
                "+91 98765 43210",
                "hello@sunrise-hostel.demo"
        ));
        verifyOrganization(response.id());
        return response.id();
    }

    private UUID createGatedOrganization(User owner) {
        var response = organizationService.create(owner.getId(), new CreateOrganizationRequest(
                "Green Valley Residences",
                GATED_SLUG,
                OrganizationType.GATED_COMMUNITY,
                null,
                "A verified gated community demo with unit-based accommodation and marketplace metrics.",
                "Hyderabad",
                "Gachibowli",
                "Telangana",
                "500032",
                "45 Valley View Lane",
                new BigDecimal("17.440081"),
                new BigDecimal("78.348912"),
                "+91 98765 12345",
                "contact@green-valley.demo"
        ));
        verifyOrganization(response.id());
        return response.id();
    }

    private void verifyOrganization(UUID organizationId) {
        Organization organization = organizationRepository.findActiveById(organizationId)
                .orElseThrow();
        organization.setStatus(OrganizationStatus.VERIFIED);
        organization.setVerifiedAt(clock.instant());
        organization.setProfileCompletenessScore((short) 92);
        organizationRepository.save(organization);
    }

    private void seedMarketplaceExtras(UUID organizationId) {
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO organization_images (id, organization_id, url, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, 0, now(), now())
                    """,
                    UUID.randomUUID(),
                    organizationId,
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"
            );
            jdbcTemplate.update(
                    """
                    INSERT INTO organization_images (id, organization_id, url, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, 1, now(), now())
                    """,
                    UUID.randomUUID(),
                    organizationId,
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"
            );

            List<String> amenityNames = List.of("WiFi", "Laundry", "Parking", "CCTV", "Housekeeping");
            for (String name : amenityNames) {
                jdbcTemplate.update(
                        """
                        INSERT INTO organization_amenities (organization_id, amenity_id)
                        SELECT ?, a.id FROM amenities a WHERE a.name = ?
                        ON CONFLICT DO NOTHING
                        """,
                        organizationId,
                        name
                );
            }
        } catch (Exception exception) {
            log.warn("Could not seed marketplace extras for org {}: {}", organizationId, exception.getMessage());
        }
    }

    private Membership seedStaff(UUID organizationId, User owner, User staff) {
        var staffRole = roleService.createRole(organizationId, new CreateRoleRequest(
                "Operations Manager",
                List.of(
                        "dashboard:view",
                        "complaint:read",
                        "complaint:manage",
                        "complaint:assign",
                        "announcement:read",
                        "announcement:manage",
                        "resident:read",
                        "resident:manage",
                        "building:manage",
                        "payment:manage",
                        "notification:read"
                )
        ));

        membershipService.inviteStaff(
                organizationId,
                owner.getId(),
                new StaffInviteRequest(staff.getEmail(), staffRole.id())
        );

        return membershipRepository.findActiveByUserIdAndOrganizationId(staff.getId(), organizationId)
                .orElseThrow();
    }

    private Membership seedResident(UUID organizationId, User resident) {
        var residentRole = roleRepository.findActiveByOrganizationIdAndName(organizationId, RoleConstants.RESIDENT)
                .orElseThrow();

        Membership membership = new Membership();
        membership.setId(UUID.randomUUID());
        membership.setUser(resident);
        membership.setOrganization(organizationRepository.findActiveById(organizationId).orElseThrow());
        membership.setRole(residentRole);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setJoinedAt(clock.instant().minus(14, ChronoUnit.DAYS));
        return membershipRepository.save(membership);
    }

    private void seedHostelAccommodation(UUID organizationId, UUID residentMembershipId) {
        var building = buildingService.create(organizationId, new CreateBuildingRequest("Block A", "A"));
        var floor = floorService.create(organizationId, building.id(), new CreateFloorRequest(1, "Ground Floor"));
        var room = spaceService.create(organizationId, floor.id(), new CreateSpaceRequest("101", "Room 101"));
        var bedA = bedService.create(organizationId, room.id(), new CreateBedRequest("A"));
        bedService.create(organizationId, room.id(), new CreateBedRequest("B"));

        occupancyService.allocate(organizationId, new AllocateOccupancyRequest(
                residentMembershipId,
                bedA.id(),
                null,
                LocalDate.now(clock).minusDays(10),
                new BigDecimal("8000"),
                null
        ));
    }

    private void seedGatedAccommodation(UUID organizationId) {
        var building = buildingService.create(organizationId, new CreateBuildingRequest("Tower 1", "T1"));
        var floor = floorService.create(organizationId, building.id(), new CreateFloorRequest(2, "Level 2"));
        spaceService.create(organizationId, floor.id(), new CreateSpaceRequest("201", "Unit 201"));
        spaceService.create(organizationId, floor.id(), new CreateSpaceRequest("202", "Unit 202"));
    }

    private void seedComplaints(UUID organizationId, Membership resident, Membership staff) {
        Instant now = clock.instant();

        saveComplaint(organizationId, resident, staff, "Slow Wi-Fi in room 101",
                "Internet drops every evening after 6pm.", ComplaintCategory.WIFI,
                ComplaintPriority.MEDIUM, ComplaintStatus.OPEN, now.minus(2, ChronoUnit.DAYS), null);

        saveComplaint(organizationId, resident, staff, "AC not cooling",
                "Air conditioner in room 101 is blowing warm air.", ComplaintCategory.MAINTENANCE,
                ComplaintPriority.HIGH, ComplaintStatus.IN_PROGRESS, now.minus(3, ChronoUnit.DAYS), now.minus(1, ChronoUnit.DAYS));

        Complaint resolved = saveComplaint(organizationId, resident, staff, "Water leakage fixed",
                "Bathroom tap was leaking — now resolved.", ComplaintCategory.PLUMBING,
                ComplaintPriority.MEDIUM, ComplaintStatus.RESOLVED, now.minus(7, ChronoUnit.DAYS), now.minus(5, ChronoUnit.DAYS));
        resolved.setResolvedAt(now.minus(4, ChronoUnit.DAYS));
        resolved.setFirstResponseAt(now.minus(6, ChronoUnit.DAYS));
        complaintRepository.save(resolved);

        Complaint reopened = saveComplaint(organizationId, resident, staff, "Noise from common area",
                "Loud music after quiet hours returned.", ComplaintCategory.NOISE,
                ComplaintPriority.LOW, ComplaintStatus.REOPENED, now.minus(10, ChronoUnit.DAYS), now.minus(8, ChronoUnit.DAYS));
        reopened.setResolvedAt(null);
        reopened.setFirstResponseAt(now.minus(9, ChronoUnit.DAYS));
        complaintRepository.save(reopened);
    }

    private Complaint saveComplaint(
            UUID organizationId,
            Membership resident,
            Membership staff,
            String title,
            String description,
            ComplaintCategory category,
            ComplaintPriority priority,
            ComplaintStatus status,
            Instant createdAt,
            Instant assignedAt
    ) {
        Complaint complaint = new Complaint();
        complaint.setId(UUID.randomUUID());
        complaint.setOrganization(organizationRepository.findActiveById(organizationId).orElseThrow());
        complaint.setCreatedByMembership(resident);
        complaint.setTitle(title);
        complaint.setDescription(description);
        complaint.setCategory(category);
        complaint.setPriority(priority);
        complaint.setStatus(status);
        if (status != ComplaintStatus.OPEN) {
            complaint.setAssignedToMembership(staff);
            complaint.setAssignedAt(assignedAt);
        }
        complaint.setCreatedAt(createdAt);
        complaint.setUpdatedAt(createdAt);
        return complaintRepository.save(complaint);
    }

    private void seedAnnouncements(UUID organizationId, User owner) {
        Instant now = clock.instant();
        saveAnnouncement(organizationId, owner, "Welcome to Sunrise Hostel",
                "We're glad to have you. Quiet hours are 10pm–7am.", AnnouncementType.GENERAL, now.minus(5, ChronoUnit.DAYS));
        saveAnnouncement(organizationId, owner, "Scheduled maintenance — water pump",
                "Water supply may be interrupted on Sunday 9am–11am.", AnnouncementType.MAINTENANCE, now.minus(2, ChronoUnit.DAYS));
        saveAnnouncement(organizationId, owner, "Community movie night",
                "Join us Friday at 7pm in the common lounge.", AnnouncementType.EVENT, now.minus(1, ChronoUnit.DAYS));
    }

    private void seedFoodMenu(UUID organizationId) {
        String[][] weekly = {
                {"Idli, Sambar, Chutney", "Rice, Dal, Curry", "Chapati, Paneer curry"},
                {"Poha, Tea", "Veg biryani, Raita", "Dosa, Sambar"},
                {"Upma, Coffee", "Roti, Rajma", "Fried rice, Manchurian"},
                {"Bread, Butter, Jam", "Lemon rice, Papad", "Paratha, Curd"},
                {"Masala dosa", "Meals — rice, sambar, poriyal", "Noodles, soup"},
                {"Aloo paratha", "Pulao, Raita", "Pasta, garlic bread"},
                {"Pancakes, Fruit", "Special thali", "Biryani, Salad"},
        };
        for (int day = 1; day <= 7; day++) {
            MealType[] meals = MealType.values();
            for (int mealIndex = 0; mealIndex < meals.length; mealIndex++) {
                jdbcTemplate.update(
                        """
                        INSERT INTO food_menu_slots (id, organization_id, day_of_week, meal_type, items, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                        ON CONFLICT (organization_id, day_of_week, meal_type) DO NOTHING
                        """,
                        UUID.randomUUID(),
                        organizationId,
                        (short) day,
                        meals[mealIndex].name(),
                        weekly[day - 1][mealIndex]
                );
            }
        }
    }

    private void saveAnnouncement(
            UUID organizationId,
            User owner,
            String title,
            String content,
            AnnouncementType type,
            Instant publishedAt
    ) {
        Announcement announcement = new Announcement();
        announcement.setId(UUID.randomUUID());
        announcement.setOrganization(organizationRepository.findActiveById(organizationId).orElseThrow());
        announcement.setCreatedBy(owner);
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setType(type);
        announcement.setPublishedAt(publishedAt);
        announcement.setCreatedAt(publishedAt);
        announcement.setUpdatedAt(publishedAt);
        announcementRepository.save(announcement);
    }

    private void seedReview(UUID organizationId, Membership residentMembership) {
        Review review = new Review();
        review.setId(UUID.randomUUID());
        review.setOrganization(organizationRepository.findActiveById(organizationId).orElseThrow());
        review.setMembership(residentMembership);
        review.setRating((short) 4);
        review.setBody("Clean rooms and responsive staff. Wi-Fi could be more stable in the evenings.");
        review.setCreatedAt(clock.instant().minus(3, ChronoUnit.DAYS));
        review.setUpdatedAt(clock.instant().minus(3, ChronoUnit.DAYS));
        reviewRepository.save(review);
    }
}
