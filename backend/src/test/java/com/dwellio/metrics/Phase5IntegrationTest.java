package com.dwellio.metrics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class Phase5IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void metricsRebuildReflectsAvailabilityAndResidents() throws Exception {
        String ownerToken = registerAndLogin("owner-p5@example.com", "Owner P5");
        String residentToken = registerAndLogin("resident-p5@example.com", "Resident P5");

        String organizationId = createHostel(ownerToken);
        String roomId = createStructure(ownerToken, organizationId);
        String bedAId = createBed(ownerToken, organizationId, roomId, "A");
        createBed(ownerToken, organizationId, roomId, "B");

        approveResident(ownerToken, residentToken, organizationId);
        String membershipId = getResidentMembershipId(ownerToken, organizationId, "resident-p5@example.com");

        mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBeds").value(2))
                .andExpect(jsonPath("$.availableBeds").value(2))
                .andExpect(jsonPath("$.activeResidentCount").value(1))
                .andExpect(jsonPath("$.occupancyRate").value(0.0));

        mockMvc.perform(post("/organizations/{organizationId}/occupancies/allocate", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "membershipId": "%s",
                                  "bedId": "%s",
                                  "moveInDate": "2026-06-01"
                                }
                                """.formatted(membershipId, bedAId)))
                .andExpect(status().isCreated());

        MvcResult rebuildResult = mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBeds").value(2))
                .andExpect(jsonPath("$.availableBeds").value(1))
                .andExpect(jsonPath("$.occupiedBeds").value(1))
                .andExpect(jsonPath("$.partialRooms").value(1))
                .andExpect(jsonPath("$.activeResidentCount").value(1))
                .andReturn();

        JsonNode metrics = objectMapper.readTree(rebuildResult.getResponse().getContentAsString());
        assertThat(metrics.get("occupancyRate").asDouble()).isEqualTo(50.0);

        mockMvc.perform(get("/organizations/{organizationId}/dashboard", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableBeds").value(1))
                .andExpect(jsonPath("$.occupiedBeds").value(1));
    }

    private String createHostel(String ownerToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Phase 5 Hostel",
                                  "slug": "phase5-hostel",
                                  "type": "HOSTEL",
                                  "description": "Metrics test",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createStructure(String ownerToken, String organizationId) throws Exception {
        MvcResult buildingResult = mockMvc.perform(post("/organizations/{organizationId}/buildings", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Block A\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String buildingId = objectMapper.readTree(buildingResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult floorResult = mockMvc.perform(post(
                        "/organizations/{organizationId}/buildings/{buildingId}/floors",
                        organizationId, buildingId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"floorNumber\":1}"))
                .andExpect(status().isCreated())
                .andReturn();
        String floorId = objectMapper.readTree(floorResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult roomResult = mockMvc.perform(post(
                        "/organizations/{organizationId}/floors/{floorId}/spaces",
                        organizationId, floorId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"101\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(roomResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createBed(String ownerToken, String organizationId, String roomId, String label) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/spaces/{spaceId}/beds",
                        organizationId, roomId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bedLabel\":\"%s\"}".formatted(label)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
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
