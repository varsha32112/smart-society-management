package com.society.society_backend.dto;

import com.society.society_backend.entity.ComplaintStatus;

import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        ComplaintStatus status,
        String remarks,
        String flatLabel,
        LocalDateTime createdAt) {
}
