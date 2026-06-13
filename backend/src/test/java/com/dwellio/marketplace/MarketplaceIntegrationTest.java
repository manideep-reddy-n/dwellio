package com.dwellio.marketplace;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.organization.repository.OrganizationRepository;
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
class MarketplaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    void verifiedOrganizationAppearsInSearchAndProfile() throws Exception {
        String ownerToken = registerAndLogin("owner-mkt@example.com", "Owner Mkt");
        String slug = "marketplace-demo-hostel";

        mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Marketplace Demo Hostel",
                                  "slug": "%s",
                                  "type": "HOSTEL",
                                  "description": "Verified marketplace listing",
                                  "city": "Hyderabad",
                                  "area": "Madhapur"
                                }
                                """.formatted(slug)))
                .andExpect(status().isCreated());

        var org = organizationRepository.findActiveBySlug(slug).orElseThrow();
        org.setStatus(OrganizationStatus.VERIFIED);
        organizationRepository.save(org);

        mockMvc.perform(get("/marketplace/organizations")
                        .param("city", "Hyderabad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value(slug));

        mockMvc.perform(get("/marketplace/organizations/{slug}", slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Marketplace Demo Hostel"))
                .andExpect(jsonPath("$.metrics").exists());

        mockMvc.perform(get("/marketplace/organizations/{slug}/reviews", slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void pendingOrganizationNotPublic() throws Exception {
        String ownerToken = registerAndLogin("owner-mkt2@example.com", "Owner Mkt2");
        String slug = "pending-hostel";

        mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Pending Hostel",
                                  "slug": "%s",
                                  "type": "HOSTEL",
                                  "city": "Hyderabad"
                                }
                                """.formatted(slug)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/marketplace/organizations/{slug}", slug))
                .andExpect(status().isNotFound());
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
