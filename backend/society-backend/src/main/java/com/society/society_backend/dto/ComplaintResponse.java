package com.society.society_backend.dto;

import com.society.society_backend.entity.ComplaintStatus;

import java.time.LocalDateTime;

public record ComplaintResponse(Long id,
                                String title,
                                String description,
                                ComplaintStatus status,
                                String adminRemarks,
                                Long residentId,
                                String residentName,
                                String flatLabel,
                                LocalDateTime createdAt) {
}
