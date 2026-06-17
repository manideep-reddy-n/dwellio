package com.dwellio.billing.controller;

import com.dwellio.billing.dto.BillingRuleResponse;
import com.dwellio.billing.dto.UpsertBillingRuleRequest;
import com.dwellio.billing.service.BillingRuleService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/billing-rules")
@RequiredArgsConstructor
public class BillingRuleController {

    private final BillingRuleService billingRuleService;

    @GetMapping
    public List<BillingRuleResponse> list(@PathVariable UUID organizationId) {
        return billingRuleService.list(organizationId);
    }

    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public BillingRuleResponse upsert(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpsertBillingRuleRequest request
    ) {
        return billingRuleService.upsert(organizationId, request);
    }
}
