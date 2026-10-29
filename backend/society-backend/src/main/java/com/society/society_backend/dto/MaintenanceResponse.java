package com.society.society_backend.dto;

import com.society.society_backend.entity.MaintenanceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceResponse(
        Long id,
        Long flatId,
        String flatLabel,
        LocalDate billMonth,
        BigDecimal amount,
        MaintenanceStatus status,
        LocalDate paidOn) {
}