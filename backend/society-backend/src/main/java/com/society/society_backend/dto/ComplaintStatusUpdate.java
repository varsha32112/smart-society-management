package com.society.society_backend.dto;

import com.society.society_backend.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComplaintStatusUpdate(
        @NotNull(message = "Status is required")
        ComplaintStatus status,

        @Size(max = 255, message = "Remarks must be 255 characters or fewer")
        String adminRemarks) {
}
