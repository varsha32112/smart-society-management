package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

    public record ProfileUpdate(
            @NotBlank(message = "Full name is required")
            @Size(max = 100, message = "Full name must be 100 characters or fewer")
            String fullName,

            @Pattern(regexp = "^$|[0-9+\\- ]{7,15}", message = "Phone must be 7 to 15 characters: digits, + - or spaces")
            String phone) {
    }

