package com.dwellio.payment.dto;

public record CheckoutResponse(
    String paymentSessionId,
    String orderId
) {}
