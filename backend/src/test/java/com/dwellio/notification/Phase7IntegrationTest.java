package com.dwellio.notification;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class Phase7IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void joinApprovalCreatesNotificationInbox() throws Exception {
        String ownerToken = registerAndLogin("owner-p7@example.com", "Owner P7");
        String residentToken = registerAndLogin("resident-p7@example.com", "Resident P7");

        String organizationId = createHostel(ownerToken, "phase7-hostel");

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

        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        MvcResult inboxResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].type").value("JOIN_REQUEST_APPROVED"))
                .andExpect(jsonPath("$.content[0].status").value("UNREAD"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andReturn();

        String notificationId = objectMapper.readTree(inboxResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asText();

        mockMvc.perform(patch("/notifications/{notificationId}/read", notificationId)
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void complaintCreatedNotifiesStaff() throws Exception {
        String ownerToken = registerAndLogin("owner-p7b@example.com", "Owner P7B");
        String residentToken = registerAndLogin("resident-p7b@example.com", "Resident P7B");

        String organizationId = createHostel(ownerToken, "phase7-hostel-complaint");
        approveResident(ownerToken, residentToken, organizationId);

        mockMvc.perform(post("/organizations/{organizationId}/complaints", organizationId)
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Broken fan",
                                  "description": "Ceiling fan not working",
                                  "category": "MAINTENANCE",
                                  "priority": "MEDIUM"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/notifications/unread-count")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].type").value("COMPLAINT_CREATED"));
    }

    private String createHostel(String ownerToken, String slug) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Phase 7 Hostel",
                                  "slug": "%s",
                                  "type": "HOSTEL",
                                  "description": "Notification test",
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
