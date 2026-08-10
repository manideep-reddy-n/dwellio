package com.dwellio.payment.service;

import com.dwellio.common.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashfreeService {

    @Value("${dwellio.cashfree.app-id:}")
    private String appId;

    @Value("${dwellio.cashfree.secret-key:}")
    private String secretKey;

    @Value("${dwellio.cashfree.environment:SANDBOX}")
    private String environment;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    private String getBaseUrl() {
        return "PRODUCTION".equalsIgnoreCase(environment) 
            ? "https://api.cashfree.com/pg" 
            : "https://sandbox.cashfree.com/pg";
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-version", "2023-08-01");
        headers.set("x-client-id", appId == null ? "" : appId.trim());
        headers.set("x-client-secret", secretKey == null ? "" : secretKey.trim());
        return headers;
    }

    public CashfreeOrderResponse createOrder(String orderId, BigDecimal amount, String customerId, String customerName, String customerPhone, String customerEmail) {
        String url = getBaseUrl() + "/orders";

        String phone = (customerPhone != null && customerPhone.replaceAll("\\D", "").length() >= 10) 
            ? customerPhone.replaceAll("\\D", "") 
            : "9999999999";

        Map<String, Object> customerDetails = new HashMap<>();
        customerDetails.put("customer_id", customerId);
        customerDetails.put("customer_name", (customerName != null && !customerName.isBlank()) ? customerName : "Resident");
        customerDetails.put("customer_phone", phone);
        if (customerEmail != null && !customerEmail.isBlank()) {
            customerDetails.put("customer_email", customerEmail);
        }

        Map<String, Object> request = new HashMap<>();
        request.put("order_id", orderId);
        request.put("order_amount", amount);
        request.put("order_currency", "INR");
        request.put("customer_details", customerDetails);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, getHeaders());

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            return new CashfreeOrderResponse(
                json.get("order_id").asText(),
                json.get("payment_session_id").asText()
            );
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Cashfree API returned error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ApiException(e.getStatusCode().value(), "Cashfree error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error creating Cashfree order", e);
            throw new ApiException(500, "Could not create payment session: " + e.getMessage());
        }
    }

    public String getOrderStatus(String orderId) {
        String url = getBaseUrl() + "/orders/" + orderId;
        HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("order_status").asText();
        } catch (Exception e) {
            log.error("Error fetching Cashfree order status", e);
            throw new ApiException(500, "Could not verify payment status");
        }
    }

    public record CashfreeOrderResponse(String orderId, String paymentSessionId) {}
}
