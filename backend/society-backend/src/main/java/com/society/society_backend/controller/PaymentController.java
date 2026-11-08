package com.society.society_backend.controller;

import com.society.society_backend.dto.OrderRequest;
import com.society.society_backend.dto.OrderResponse;
import com.society.society_backend.dto.PaymentConfig;
import com.society.society_backend.dto.ReconcileResult;
import com.society.society_backend.dto.VerifyRequest;
import com.society.society_backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/config")
    public PaymentConfig config() {
        return paymentService.config();
    }

    @PostMapping("/orders")
    public OrderResponse createOrder(@Valid @RequestBody OrderRequest request, Authentication authentication) {
        return paymentService.createOrder(request.billId(), authentication.getName());
    }

    @PostMapping("/verify")
    public ResponseEntity<Void> verify(@Valid @RequestBody VerifyRequest request, Authentication authentication) {
        paymentService.verify(request, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reconcile")
    public ReconcileResult reconcile(Authentication authentication) {
        return paymentService.reconcile(authentication.getName());
    }
}
