package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRequest(
        @NotBlank(message = "Order is required") String razorpayOrderId,
        @NotBlank(message = "Payment is required") String razorpayPaymentId,
        @NotBlank(message = "Signature is required") String razorpaySignature) {
}
