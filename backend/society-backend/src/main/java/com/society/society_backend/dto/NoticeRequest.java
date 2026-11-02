package com.society.society_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be 150 characters or fewer")
        String title,

        @NotBlank(message = "Content is required")
        @Size(max = 5000, message = "Content must be 5000 characters or fewer")
        String content) {
}
