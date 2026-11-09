package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClaimRejection(
        @NotBlank(message = "Please give a reason")
        @Size(max = 255, message = "The reason must be 255 characters or fewer")
        String note) {
}

