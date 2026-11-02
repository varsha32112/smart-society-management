package com.society.society_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FlatRequest(
        @NotBlank(message = "Block name is required")
        @Size(max = 10, message = "Block name must be 10 characters or fewer")
        String blockName,

        @NotBlank(message = "Flat number is required")
        @Size(max = 10, message = "Flat number must be 10 characters or fewer")
        String flatNumber,

        @Min(value = 0, message = "Floor cannot be negative")
        @Max(value = 100, message = "Floor must be 100 or lower")
        Integer floorNo) {
}
