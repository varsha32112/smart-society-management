package com.society.society_backend.dto;

import com.society.society_backend.entity.VisitorStatus;

import java.time.LocalDateTime;

public record VisitorResponse(Long id,
                              String visitorName,
                              String visitorPhone,
                              String purpose,
                              Long flatId,
                              String flatLabel,
                              VisitorStatus status,
                              LocalDateTime entryTime,
                              LocalDateTime exitTime,
                              LocalDateTime createdAt) {
}
