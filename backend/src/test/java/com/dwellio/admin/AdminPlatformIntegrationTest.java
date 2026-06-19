package com.dwellio.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.domain.entity.User;
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
class AdminPlatformIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void platformAdminDashboardUsersAndPushPreferences() throws Exception {
        String userEmail = "platform-user@example.com";
        String adminEmail = "platform-admin@example.com";

        String userToken = registerAndLogin(userEmail, "Platform User");
        String adminToken = registerPlatformAdmin(adminEmail, "Platform Admin");

        mockMvc.perform(get("/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.totalOrganizations").isNumber());

        mockMvc.perform(get("/admin/mission-control")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platformHealth.totalOrganizations").isNumber())
                .andExpect(jsonPath("$.liveActivity").isArray())
                .andExpect(jsonPath("$.verification.pendingCount").isNumber());

        mockMvc.perform(get("/admin/search")
                        .param("q", "platform")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray());

        mockMvc.perform(get("/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        mockMvc.perform(get("/admin/settings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/notification-preferences")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").exists());

        mockMvc.perform(patch("/notification-preferences/COMPLAINTS")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pushEnabled\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pushEnabled").value(false));

        mockMvc.perform(get("/push/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pushConfigured").isBoolean());

        mockMvc.perform(post("/push/subscriptions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "endpoint": "https://push.example.com/device/1",
                                  "p256dh": "test-p256dh-key",
                                  "auth": "test-auth-key",
                                  "userAgent": "integration-test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty());

        mockMvc.perform(get("/push/subscriptions")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].endpoint").value("https://push.example.com/device/1"));

        MvcResult usersResult = mockMvc.perform(get("/admin/users?query=platform-user")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String userId = objectMapper.readTree(usersResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asText();

        mockMvc.perform(post("/admin/users/{userId}/suspend", userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    private String registerPlatformAdmin(String email, String fullName) throws Exception {
        register(email, fullName);
        User user = userRepository.findActiveByEmail(email).orElseThrow();
        user.setPlatformAdmin(true);
        userRepository.save(user);
        return login(email);
    }

    private void register(String email, String fullName) throws Exception {
        String phone = "+9198765" + String.format("%04d", Math.abs(email.hashCode() % 10000));
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "%s",
                                  "email": "%s",
                                  "phone": "%s",
                                  "password": "Password123!"
                                }
                                """.formatted(fullName, email, phone)))
                .andExpect(status().isCreated());
    }

    private String registerAndLogin(String email, String fullName) throws Exception {
        register(email, fullName);
        return login(email);
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "Password123!"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }
}
