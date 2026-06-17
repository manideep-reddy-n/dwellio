package com.dwellio.complaint;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ComplaintSlaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void orgSlaSettingsSummaryFilterAndMetricsProjection() throws Exception {
        String ownerToken = registerAndLogin("owner-sla@example.com", "Owner SLA");
        String residentToken = registerAndLogin("resident-sla@example.com", "Resident SLA");

        String organizationId = createHostel(ownerToken);
        approveResident(ownerToken, residentToken, organizationId);

        mockMvc.perform(patch("/organizations/{organizationId}", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "slaFirstResponseHours": 1,
                                  "slaResolutionHours": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slaFirstResponseHours").value(1))
                .andExpect(jsonPath("$.slaResolutionHours").value(2));

        MvcResult complaintResult = mockMvc.perform(post("/organizations/{organizationId}/complaints", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Broken AC",
                                  "description": "Room is too hot",
                                  "category": "MAINTENANCE",
                                  "priority": "HIGH"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slaBreached").value(false))
                .andReturn();

        String complaintId = objectMapper.readTree(complaintResult.getResponse().getContentAsString())
                .get("id").asText();

        Instant backdated = Instant.now().minus(3, ChronoUnit.HOURS);
        jdbcTemplate.update(
                "UPDATE complaints SET created_at = ? WHERE id = ?",
                Timestamp.from(backdated),
                UUID.fromString(complaintId)
        );

        mockMvc.perform(get("/organizations/{organizationId}/complaints/sla-summary", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slaFirstResponseHours").value(1))
                .andExpect(jsonPath("$.slaResolutionHours").value(2))
                .andExpect(jsonPath("$.violationsCount").value(1))
                .andExpect(jsonPath("$.breachedComplaints.length()").value(1))
                .andExpect(jsonPath("$.breachedComplaints[0].id").value(complaintId))
                .andExpect(jsonPath("$.breachedComplaints[0].breachTypes").isArray());

        mockMvc.perform(get("/organizations/{organizationId}/complaints", organizationId)
                        .param("slaBreach", "true")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].slaBreached").value(true));

        mockMvc.perform(get("/organizations/{organizationId}/complaints", organizationId)
                        .param("slaBreach", "false")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(post("/organizations/{organizationId}/metrics/rebuild", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slaFirstResponseHours").value(1))
                .andExpect(jsonPath("$.slaResolutionHours").value(2))
                .andExpect(jsonPath("$.slaViolationsCount").value(1));
    }

    private String createHostel(String ownerToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "SLA Hostel",
                                  "slug": "sla-hostel-%s",
                                  "type": "HOSTEL",
                                  "hostelAudience": "CO_ED",
                                  "description": "SLA phase D",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """.formatted(System.nanoTime())))
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
