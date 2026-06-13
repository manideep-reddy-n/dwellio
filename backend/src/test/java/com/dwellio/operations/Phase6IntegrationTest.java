package com.dwellio.operations;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dwellio.domain.entity.Membership;
import com.dwellio.membership.repository.MembershipRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase6IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MembershipRepository membershipRepository;

    @Test
    void complaintWorkflowReopenAndMetrics() throws Exception {
        String ownerToken = registerAndLogin("owner-p6@example.com", "Owner P6");
        String residentToken = registerAndLogin("resident-p6@example.com", "Resident P6");

        String organizationId = createHostel(ownerToken, "phase6-hostel-complaints");
        approveResident(ownerToken, residentToken, organizationId);

        MvcResult complaintResult = mockMvc.perform(post("/organizations/{organizationId}/complaints", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "No hot water",
                                  "description": "Water heater not working",
                                  "category": "PLUMBING",
                                  "priority": "HIGH"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn();

        String complaintId = objectMapper.readTree(complaintResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(post("/organizations/{organizationId}/complaints/{complaintId}/resolve",
                        organizationId, complaintId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.firstResponseAt").isNotEmpty());

        mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openComplaintCount").value(0))
                .andExpect(jsonPath("$.resolutionRate").value(100.0))
                .andExpect(jsonPath("$.complaintCategoryDistribution[?(@.category=='PLUMBING')].count").value(1));

        mockMvc.perform(get("/organizations/{organizationId}/complaints", organizationId)
                        .param("category", "PLUMBING")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("PLUMBING"));

        mockMvc.perform(get("/organizations/{organizationId}/complaints", organizationId)
                        .param("category", "WIFI")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(post("/organizations/{organizationId}/complaints/{complaintId}/reopen",
                        organizationId, complaintId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REOPENED"))
                .andExpect(jsonPath("$.resolvedAt").isEmpty());

        mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openComplaintCount").value(1));
    }

    @Test
    void announcementsAssetsAndReviews() throws Exception {
        String ownerToken = registerAndLogin("owner-p6b@example.com", "Owner P6B");
        String residentToken = registerAndLogin("resident-p6b@example.com", "Resident P6B");

        String organizationId = createHostel(ownerToken, "phase6-hostel-ops");
        approveResident(ownerToken, residentToken, organizationId);
        String membershipId = getResidentMembershipId(ownerToken, organizationId, "resident-p6b@example.com");

        MvcResult announcementResult = mockMvc.perform(post("/organizations/{organizationId}/announcements", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Maintenance notice",
                                  "content": "Water shutdown tomorrow",
                                  "type": "MAINTENANCE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.published").value(false))
                .andReturn();

        String announcementId = objectMapper.readTree(announcementResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(post("/organizations/{organizationId}/announcements/{announcementId}/publish",
                        organizationId, announcementId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published").value(true));

        mockMvc.perform(patch("/organizations/{organizationId}/announcements/{announcementId}",
                        organizationId, announcementId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Water shutdown rescheduled to Friday\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Water shutdown rescheduled to Friday"))
                .andExpect(jsonPath("$.published").value(true));

        mockMvc.perform(get("/organizations/{organizationId}/announcements", organizationId)
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Maintenance notice"));

        mockMvc.perform(post("/organizations/{organizationId}/assets", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Water Heater",
                                  "category": "Plumbing",
                                  "status": "WORKING"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Water Heater"));

        mockMvc.perform(post("/organizations/{organizationId}/reviews", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"body\":\"Great place\"}"))
                .andExpect(status().isBadRequest());

        backdateMembership(UUID.fromString(membershipId), 8);

        mockMvc.perform(post("/organizations/{organizationId}/reviews", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"body\":\"Good stay\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(4));

        mockMvc.perform(put("/organizations/{organizationId}/reviews/mine", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"body\":\"Excellent after fixes\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.body").value("Excellent after fixes"));

        mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCount").value(1))
                .andExpect(jsonPath("$.avgRating").value(5.0));
    }

    private void backdateMembership(UUID membershipId, int daysAgo) {
        Membership membership = membershipRepository.findById(membershipId).orElseThrow();
        membership.setJoinedAt(Instant.now().minus(daysAgo, ChronoUnit.DAYS));
        membershipRepository.save(membership);
    }

    private String createHostel(String ownerToken, String slug) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Phase 6 Hostel",
                                  "slug": "%s",
                                  "type": "HOSTEL",
                                  "description": "Operations test",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """.formatted(slug)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
    }

    private void approveResident(String ownerToken, String residentToken, String organizationId) throws Exception {
        mockMvc.perform(post("/organizations/{organizationId}/join-requests", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Please approve\"}"))
                .andExpect(status().isCreated());

        MvcResult joinRequestsResult = mockMvc.perform(get("/organizations/{organizationId}/join-requests", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        String joinRequestId = objectMapper.readTree(joinRequestsResult.getResponse().getContentAsString())
                .get(0).get("id").asText();

        mockMvc.perform(post("/organizations/{organizationId}/join-requests/{joinRequestId}/approve",
                        organizationId, joinRequestId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
    }

    private String getResidentMembershipId(String ownerToken, String organizationId, String email) throws Exception {
        MvcResult result = mockMvc.perform(get("/organizations/{organizationId}/memberships", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        for (JsonNode membership : objectMapper.readTree(result.getResponse().getContentAsString())) {
            if (email.equals(membership.get("userEmail").asText())) {
                return membership.get("id").asText();
            }
        }
        throw new IllegalStateException("Membership not found for " + email);
    }

    private void register(String email, String fullName) throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "%s",
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(fullName, email)))
                .andExpect(status().isCreated());
    }

    private String login(String email) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    private String registerAndLogin(String email, String fullName) throws Exception {
        register(email, fullName);
        return login(email);
    }
}
