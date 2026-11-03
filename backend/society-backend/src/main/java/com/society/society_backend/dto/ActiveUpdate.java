package com.society.society_backend.dto;

import jakarta.validation.constraints.NotNull;

public record ActiveUpdate(
        @NotNull(message = "The active flag is required")
        Boolean active) {
}
