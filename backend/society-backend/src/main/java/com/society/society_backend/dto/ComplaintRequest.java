package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComplaintRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be 150 characters or fewer")
        String title,

        @Size(max = 1000, message = "Details must be 1000 characters or fewer")
        String description) {
}
