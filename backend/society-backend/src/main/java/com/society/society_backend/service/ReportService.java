package com.society.society_backend.service;

import com.society.society_backend.dto.ReportSummary;
import com.society.society_backend.entity.ComplaintStatus;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.VisitorStatus;
import com.society.society_backend.repository.ComplaintRepository;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UserRepository;
import com.society.society_backend.repository.VisitorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class ReportService {

    private final VisitorRepository visitorRepository;
    private final ComplaintRepository complaintRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final FlatRepository flatRepository;

    public ReportService(VisitorRepository visitorRepository,
                         ComplaintRepository complaintRepository,
                         MaintenanceRepository maintenanceRepository,
                         UserRepository userRepository,
                         FlatRepository flatRepository) {
        this.visitorRepository = visitorRepository;
        this.complaintRepository = complaintRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
    }

    @Transactional(readOnly = true)
    public ReportSummary summary() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        var visitors = new ReportSummary.Visitors(
                visitorRepository.count(),
                visitorRepository.countByStatus(VisitorStatus.PENDING),
                visitorRepository.countByEntryTimeIsNotNullAndExitTimeIsNull(),
                visitorRepository.countByEntryTimeGreaterThanEqual(startOfToday));

        var complaints = new ReportSummary.Complaints(
                complaintRepository.countByStatus(ComplaintStatus.OPEN),
                complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS),
                complaintRepository.countByStatus(ComplaintStatus.RESOLVED));

        var billing = new ReportSummary.Billing(
                maintenanceRepository.countByStatus(MaintenanceStatus.PENDING),
                zeroIfNull(maintenanceRepository.sumAmountByStatus(MaintenanceStatus.PENDING)),
                maintenanceRepository.countByStatus(MaintenanceStatus.PAID),
                zeroIfNull(maintenanceRepository.sumAmountByStatus(MaintenanceStatus.PAID)));

        var society = new ReportSummary.Society(
                flatRepository.count(),
                userRepository.countByRoleAndActiveTrue(Role.RESIDENT),
                userRepository.countByRoleAndActiveTrue(Role.SECURITY));

        return new ReportSummary(visitors, complaints, billing, society);
    }

    // A sum over zero rows is null, so show it as 0.00
    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2) : value;
    }
}
