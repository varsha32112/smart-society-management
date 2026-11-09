package com.society.society_backend.dto;

import com.society.society_backend.entity.UpiClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record UpiClaimResponse(
        Long id,
        Long billId,
        String flatLabel,
        LocalDate billMonth,
        BigDecimal amount,
        String residentName,
        String utr,
        UpiClaimStatus status,
        String note,
        LocalDateTime createdAt,
        LocalDateTime decidedAt) {
}