package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StaffRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be 100 characters or fewer")
        String fullName,

        @NotBlank(message = "Email is required")
        @Size(max = 120, message = "Email must be 120 characters or fewer")
        @Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "Please enter a valid email address")
        String email,

        @Pattern(regexp = "^$|[0-9+\\- ]{7,15}", message = "Phone must be 7 to 15 characters: digits, + - or spaces")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$", message = "Password must contain at least one letter and one number")
        String password) {
}