package com.society.society_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRequest(Long flatId, LocalDate billMonth, BigDecimal amount) {
}