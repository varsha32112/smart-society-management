package com.society.society_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BulkMaintenanceRequest(
        @NotNull(message = "Bill month is required")
        LocalDate billMonth,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        @Digits(integer = 8, fraction = 2, message = "Amount can have at most 8 digits and 2 decimals")
        BigDecimal amount) {
}