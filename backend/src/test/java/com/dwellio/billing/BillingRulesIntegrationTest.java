package com.dwellio.billing;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class BillingRulesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void gatedMaintenanceBillingWithOwnershipResponsibility() throws Exception {
        String ownerToken = registerAndLogin("billing-owner@example.com", "Billing Owner");
        String residentToken = registerAndLogin("billing-resident@example.com", "Billing Resident");

        String organizationId = createGatedCommunity(ownerToken);
        String buildingId = createBuilding(ownerToken, organizationId);
        String floorId = createFloor(ownerToken, organizationId, buildingId);
        String unitId = createUnit(ownerToken, organizationId, floorId);

        mockMvc.perform(post("/organizations/{organizationId}/ownership", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "unitSpaceId": "%s",
                                  "ownerName": "Unit Owner",
                                  "ownerEmail": "billing-resident@example.com",
                                  "billingResponsibility": "TENANT",
                                  "effectiveFrom": "2026-06-01"
                                }
                                """.formatted(unitId)))
                .andExpect(status().isCreated());

        approveResident(ownerToken, residentToken, organizationId);
        String membershipId = getResidentMembershipId(ownerToken, organizationId, "billing-resident@example.com");

        mockMvc.perform(post("/organizations/{organizationId}/occupancies/allocate", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "membershipId": "%s",
                                  "unitSpaceId": "%s",
                                  "moveInDate": "2026-06-01",
                                  "occupancyClassification": "TENANT_OCCUPIED"
                                }
                                """.formatted(membershipId, unitId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.occupancyClassification").value("TENANT_OCCUPIED"));

        mockMvc.perform(get("/organizations/{organizationId}/billing-rules", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].chargeType").value("MAINTENANCE"));

        mockMvc.perform(get("/organizations/{organizationId}/payments", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].chargeType").value("MAINTENANCE"))
                .andExpect(jsonPath("$[0].membershipId").value(membershipId));

        mockMvc.perform(put("/organizations/{organizationId}/billing-rules", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chargeType": "MAINTENANCE",
                                  "recurrence": "MONTHLY",
                                  "defaultAmount": 3000,
                                  "dueDayOfMonth": 10,
                                  "appliesTo": "ALL_ACTIVE_UNITS",
                                  "billTo": "OWNER",
                                  "active": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultAmount").value(3000));
    }

    private String createGatedCommunity(String ownerToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Billing Gated",
                                  "slug": "billing-gated-%s",
                                  "type": "GATED_COMMUNITY",
                                  "description": "Phase G",
                                  "city": "Hyderabad",
                                  "area": "Gachibowli"
                                }
                                """.formatted(System.nanoTime())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billingMode").value("CALENDAR_MONTH"))
                .andReturn();
        return objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
    }

    private String createBuilding(String token, String organizationId) throws Exception {
        MvcResult result = mockMvc.perform(post("/organizations/{organizationId}/buildings", organizationId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Tower A\",\"code\":\"A\"}"))
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

    private String createUnit(String token, String organizationId, String floorId) throws Exception {
        MvcResult result = mockMvc.perform(post(
                        "/organizations/{organizationId}/floors/{floorId}/spaces",
                        organizationId, floorId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"901\",\"displayName\":\"Unit 901\"}"))
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
        var residents = objectMapper.readTree(result.getResponse().getContentAsString());
        for (var resident : residents) {
            if (email.equals(resident.get("userEmail").asText())) {
                return resident.get("id").asText();
            }
        }
        throw new IllegalStateException("Resident not found: " + email);
    }

    private void register(String email, String fullName) throws Exception {
        String phone = "9" + String.format("%09d", Math.abs(email.hashCode()) % 1_000_000_000);
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "%s",
                                  "email": "%s",
                                  "phone": "%s",
                                  "password": "password123"
                                }
                                """.formatted(fullName, email, phone)))
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
