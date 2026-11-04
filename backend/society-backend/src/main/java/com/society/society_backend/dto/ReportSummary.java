package com.society.society_backend.dto;

import java.math.BigDecimal;

public record ReportSummary(Visitors visitors, Complaints complaints, Billing billing, Society society) {

    public record Visitors(long total, long pending, long insideNow, long enteredToday) {
    }

    public record Complaints(long open, long inProgress, long resolved) {
    }

    public record Billing(long pendingBills, BigDecimal pendingAmount, long paidBills, BigDecimal paidAmount) {
    }

    public record Society(long flats, long residents, long securityStaff) {
    }
}
