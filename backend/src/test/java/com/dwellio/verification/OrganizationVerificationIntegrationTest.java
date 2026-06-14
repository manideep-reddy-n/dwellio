package com.dwellio.verification;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrganizationVerificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void verificationWorkflowAndPermissions() throws Exception {
        String ownerEmail = "owner-verify@example.com";
        String adminEmail = "admin-verify@example.com";
        String residentEmail = "resident-verify@example.com";

        String ownerToken = registerAndLogin(ownerEmail, "Owner Verify");
        registerAndLogin(residentEmail, "Resident Verify");
        String adminToken = registerPlatformAdmin(adminEmail, "Platform Admin");

        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Verify Hostel",
                                  "slug": "verify-hostel",
                                  "type": "HOSTEL",
                                  "hostelAudience": "CO_ED",
                                  "description": "Needs verification",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        String organizationId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        String residentToken = login(residentEmail);
        mockMvc.perform(get("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        MockMultipartFile document = new MockMultipartFile(
                "file",
                "license.pdf",
                "application/pdf",
                "fake-pdf-content".getBytes()
        );

        mockMvc.perform(multipart("/organizations/{organizationId}/verification-documents", organizationId)
                        .file(document)
                        .param("documentType", "TRADE_LICENSE")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentType").value("TRADE_LICENSE"));

        mockMvc.perform(post("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Please review our hostel\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.organizationStatus").value("PENDING_VERIFICATION"));

        MvcResult adminList = mockMvc.perform(get("/admin/verification-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].organizationSlug").value("verify-hostel"))
                .andReturn();

        String requestId = objectMapper.readTree(adminList.getResponse().getContentAsString())
                .get(0).get("id").asText();

        mockMvc.perform(get("/admin/verification-requests/{requestId}", requestId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/admin/verification-requests/{requestId}/approve", requestId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.organizationStatus").value("VERIFIED"));

        mockMvc.perform(get("/marketplace/organizations/verify-hostel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        mockMvc.perform(get("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationStatus").value("VERIFIED"));
    }

    @Test
    void rejectAndRequestMoreInfoFlow() throws Exception {
        String ownerEmail = "owner-verify2@example.com";
        String adminEmail = "admin-verify2@example.com";

        String ownerToken = registerAndLogin(ownerEmail, "Owner Verify 2");
        String adminToken = registerPlatformAdmin(adminEmail, "Platform Admin 2");

        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Gated Verify",
                                  "slug": "gated-verify",
                                  "type": "GATED_COMMUNITY",
                                  "city": "Hyderabad"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String organizationId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        MockMultipartFile document = new MockMultipartFile(
                "file",
                "proof.png",
                "image/png",
                new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00}
        );

        mockMvc.perform(multipart("/organizations/{organizationId}/verification-documents", organizationId)
                        .file(document)
                        .param("documentType", "PROPERTY_PROOF")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        MvcResult adminList = mockMvc.perform(get("/admin/verification-requests?status=PENDING")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String requestId = objectMapper.readTree(adminList.getResponse().getContentAsString())
                .get(0).get("id").asText();

        mockMvc.perform(post("/admin/verification-requests/{requestId}/request-more-info", requestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Upload association registration\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MORE_INFO_REQUIRED"));

        mockMvc.perform(get("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MORE_INFO_REQUIRED"));

        mockMvc.perform(post("/organizations/{organizationId}/verification-request", organizationId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(post("/admin/verification-requests/{requestId}/reject", requestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Documents incomplete\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.organizationStatus").value("REJECTED"));

        mockMvc.perform(get("/marketplace/organizations/gated-verify"))
                .andExpect(status().isNotFound());
    }

    private String registerPlatformAdmin(String email, String fullName) throws Exception {
        register(email, fullName);
        User user = userRepository.findActiveByEmail(email).orElseThrow();
        user.setPlatformAdmin(true);
        userRepository.save(user);
        return login(email);
    }

    private void register(String email, String fullName) throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "%s",
                                  "email": "%s",
                                  "password": "Password123!"
                                }
                                """.formatted(fullName, email)))
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
