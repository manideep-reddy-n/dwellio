package com.dwellio.invoice.controller;

import com.dwellio.invoice.dto.InvoiceVerificationResponse;
import com.dwellio.invoice.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/invoices")
@RequiredArgsConstructor
public class PublicInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/verify")
    public InvoiceVerificationResponse verify(
            @RequestParam("n") String invoiceNumber,
            @RequestParam("t") String token
    ) {
        return invoiceService.verify(invoiceNumber, token);
    }
}
