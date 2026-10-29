package com.society.society_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BulkMaintenanceRequest(LocalDate billMonth, BigDecimal amount) {
}