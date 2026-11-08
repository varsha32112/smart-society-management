package com.society.society_backend.dto;

import jakarta.validation.constraints.NotNull;

public record OrderRequest(
        @NotNull(message = "Bill is required")
        Long billId) {
}
