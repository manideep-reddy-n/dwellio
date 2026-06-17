package com.dwellio.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dwellio.payment.service.PaymentReminderService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
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
class PaymentNotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentReminderService paymentReminderService;

    @Autowired
    private Clock clock;

    @Test
    void paymentRemindersAndRecordedNotification() throws Exception {
        String ownerToken = registerAndLogin("owner-pay-notif@example.com", "Owner Pay Notif");
        String residentToken = registerAndLogin("resident-pay-notif@example.com", "Resident Pay Notif");

        String organizationId = createHostel(ownerToken);
        approveResident(ownerToken, residentToken, organizationId);
        String membershipId = getResidentMembershipId(ownerToken, organizationId, "resident-pay-notif@example.com");

        LocalDate today = LocalDate.now(clock);
        String utilityPaymentId = createManualCharge(
                ownerToken,
                organizationId,
                membershipId,
                "UTILITY",
                500,
                "Water bill",
                today.plusDays(5)
        );
        String penaltyPaymentId = createManualCharge(
                ownerToken,
                organizationId,
                membershipId,
                "PENALTY",
                200,
                "Late fee",
                today
        );
        String otherPaymentId = createManualCharge(
                ownerToken,
                organizationId,
                membershipId,
                "OTHER",
                300,
                "Misc charge",
                today.minusDays(1)
        );

        paymentReminderService.sendScheduledReminders();

        MvcResult inboxResult = mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andReturn();

        Set<String> reminderTypes = notificationReminderTypes(inboxResult);
        assertThat(reminderTypes).contains(
                "FIVE_DAYS_BEFORE",
                "DUE_TODAY",
                "OVERDUE"
        );

        mockMvc.perform(patch("/organizations/{organizationId}/payments/{paymentId}", organizationId, utilityPaymentId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "PAID",
                                  "amountPaid": 500,
                                  "notes": "Cash received"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        mockMvc.perform(get("/notifications")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.content[?(@.type == 'PAYMENT_RECORDED' && @.payloadJson.paymentId == '%s')]"
                                .formatted(utilityPaymentId)
                ).isNotEmpty());
    }

    private String createManualCharge(
            String ownerToken,
            String organizationId,
            String membershipId,
            String chargeType,
            int amount,
            String description,
            LocalDate dueDate
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/organizations/{organizationId}/payments/manual", organizationId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chargeType": "%s",
                                  "amount": %d,
                                  "description": "%s",
                                  "dueDate": "%s",
                                  "membershipIds": ["%s"]
                                }
                                """.formatted(chargeType, amount, description, dueDate, membershipId)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get(0).get("id").asText();
    }

    private Set<String> notificationReminderTypes(MvcResult inboxResult) throws Exception {
        JsonNode content = objectMapper.readTree(inboxResult.getResponse().getContentAsString()).get("content");
        return StreamSupport.stream(content.spliterator(), false)
                .filter(node -> "PAYMENT_DUE".equals(node.get("type").asText()))
                .filter(node -> node.has("payloadJson") && node.get("payloadJson").has("reminderType"))
                .map(node -> node.get("payloadJson").get("reminderType").asText())
                .collect(Collectors.toSet());
    }

    private String createHostel(String ownerToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/organizations")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Pay Notif Hostel",
                                  "slug": "pay-notif-hostel-%s",
                                  "type": "HOSTEL",
                                  "hostelAudience": "CO_ED",
                                  "description": "Payment notification test",
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
