package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VisitorRequest(
        @NotBlank(message = "Visitor name is required")
        @Size(max = 100, message = "Visitor name must be 100 characters or fewer")
        String visitorName,

        @Pattern(regexp = "^$|[0-9+\\- ]{7,15}", message = "Phone must be 7 to 15 characters: digits, + - or spaces")
        String visitorPhone,

        @Size(max = 200, message = "Purpose must be 200 characters or fewer")
        String purpose,

        @NotNull(message = "Flat is required")
        Long flatId) {
}
