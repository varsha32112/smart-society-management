package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FamilyMemberRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be 100 characters or fewer")
        String fullName,

        @Size(max = 30, message = "Relation must be 30 characters or fewer")
        String relation,

        @Pattern(regexp = "^$|[0-9+\\- ]{7,15}", message = "Phone must be 7 to 15 characters: digits, + - or spaces")
        String phone) {
}