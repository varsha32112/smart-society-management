package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpiClaimRequest(
        @NotNull(message = "Bill is required")
        Long billId,

        @NotBlank(message = "The UPI reference number (UTR) is required")
        @Pattern(regexp = "^[0-9]{12}$", message = "The UTR must be exactly 12 digits")
        String utr) {
}
