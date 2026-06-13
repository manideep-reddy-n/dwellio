package com.dwellio.accommodation;

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
class Phase4IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void bedBasedAccommodationAllocateAndTransfer() throws Exception {
        String ownerToken = registerAndLogin("owner-p4@example.com", "Owner P4");
        String residentToken = registerAndLogin("resident-p4@example.com", "Resident P4");

        String organizationId = createHostel(ownerToken);
        String buildingId = createBuilding(ownerToken, organizationId);
        String floorId = createFloor(ownerToken, organizationId, buildingId);
        String roomId = createRoom(ownerToken, organizationId, floorId);
        String bedAId = createBed(ownerToken, organizationId, roomId, "A");
        String bedBId = createBed(ownerToken, organizationId, roomId, "B");

        approveResident(ownerToken, residentToken, organizationId);
        String membershipId = getResidentMembershipId(ownerToken, organizationId, "resident-p4@example.com");

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
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.current").value(true))
                .andExpect(jsonPath("$.bedId").value(bedAId));

        mockMvc.perform(get("/organizations/{organizationId}/spaces/{spaceId}", organizationId, roomId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PARTIALLY_OCCUPIED"))
                .andExpect(jsonPath("$.capacity").value(2));

        mockMvc.perform(post("/organizations/{organizationId}/occupancies/transfer", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "membershipId": "%s",
                                  "targetBedId": "%s",
                                  "transferDate": "2026-06-10"
                                }
                                """.formatted(membershipId, bedBId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.current").value(true))
                .andExpect(jsonPath("$.bedId").value(bedBId));

        mockMvc.perform(get("/organizations/{organizationId}/accommodation/visualization", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accommodationMode").value("BED_BASED"))
                .andExpect(jsonPath("$.buildings[0].floors[0].spaces[0].beds[1].currentOccupant.residentName")
                        .value("Resident P4"));
    }

    @Test
    void rejectsBedCrudForUnitBasedOrganization() throws Exception {
        String ownerToken = registerAndLogin("gated-owner@example.com", "Gated Owner");

        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Green Valley",
                                  "slug": "green-valley-p4",
                                  "type": "GATED_COMMUNITY",
                                  "description": "Gated community",
                                  "city": "Hyderabad",
                                  "area": "Gachibowli"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String organizationId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();
        String buildingId = createBuilding(ownerToken, organizationId);
        String floorId = createFloor(ownerToken, organizationId, buildingId);
        String unitId = createUnit(ownerToken, organizationId, floorId);

        mockMvc.perform(post("/organizations/{organizationId}/spaces/{spaceId}/beds", organizationId, unitId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bedLabel\":\"A\"}"))
                .andExpect(status().isBadRequest());
    }

    private String createHostel(String ownerToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Phase 4 Hostel",
                                  "slug": "phase4-hostel",
                                  "type": "HOSTEL",
                                  "description": "Test hostel",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createBuilding(String token, String organizationId) throws Exception {
        MvcResult result = mockMvc.perform(post("/organizations/{organizationId}/buildings", organizationId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Block A\",\"code\":\"A\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createFloor(String token, String organizationId, String buildingId) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/buildings/{buildingId}/floors",
                        organizationId, buildingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"floorNumber\":1,\"name\":\"Ground\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createRoom(String token, String organizationId, String floorId) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/floors/{floorId}/spaces",
                        organizationId, floorId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"101\",\"displayName\":\"Room 101\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spaceType").value("ROOM"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createUnit(String token, String organizationId, String floorId) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/floors/{floorId}/spaces",
                        organizationId, floorId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"801\",\"displayName\":\"Unit 801\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spaceType").value("UNIT"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createBed(String token, String organizationId, String roomId, String label) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/spaces/{spaceId}/beds",
                        organizationId, roomId)
                        .header("Authorization", "Bearer " + token)
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
