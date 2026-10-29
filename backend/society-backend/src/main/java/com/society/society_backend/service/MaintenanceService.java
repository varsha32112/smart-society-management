package com.society.society_backend.service;

import com.society.society_backend.dto.BulkGenerateResult;
import com.society.society_backend.dto.BulkMaintenanceRequest;
import com.society.society_backend.dto.MaintenanceRequest;
import com.society.society_backend.dto.MaintenanceResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final FlatRepository flatRepository;
    private final UserRepository userRepository;

    public MaintenanceService(MaintenanceRepository maintenanceRepository,
                              FlatRepository flatRepository,
                              UserRepository userRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.flatRepository = flatRepository;
        this.userRepository = userRepository;
    }

    // Admin creates one bill for one flat.
    @Transactional
    public MaintenanceResponse create(MaintenanceRequest request) {
        LocalDate month = normalizeMonth(request.billMonth());
        BigDecimal amount = validateAmount(request.amount());
        if (request.flatId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flat is required");
        }

        Flat flat = flatRepository.findById(request.flatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flat not found"));

        if (maintenanceRepository.existsByFlatIdAndBillMonth(flat.getId(), month)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A bill for this flat and month already exists");
        }
        return toResponse(maintenanceRepository.save(newBill(flat, month, amount)));
    }

    // Admin creates the bill for every flat. Flats that already have one are skipped.
    @Transactional
    public BulkGenerateResult generateForAll(BulkMaintenanceRequest request) {
        LocalDate month = normalizeMonth(request.billMonth());
        BigDecimal amount = validateAmount(request.amount());

        int created = 0;
        int skipped = 0;
        for (Flat flat : flatRepository.findAll()) {
            if (maintenanceRepository.existsByFlatIdAndBillMonth(flat.getId(), month)) {
                skipped++;
            } else {
                maintenanceRepository.save(newBill(flat, month, amount));
                created++;
            }
        }
        return new BulkGenerateResult(created, skipped);
    }

    // Admin records that a bill has been paid.
    @Transactional
    public MaintenanceResponse markPaid(Long id) {
        Maintenance bill = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (bill.getStatus() == MaintenanceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bill is already paid");
        }
        bill.setStatus(MaintenanceStatus.PAID);
        bill.setPaidOn(LocalDate.now());
        return toResponse(maintenanceRepository.save(bill));
    }

    // Resident sees the bills of their own flat, newest first.
    public List<MaintenanceResponse> myBills(String residentEmail) {
        User resident = userRepository.findByEmail(residentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (resident.getFlat() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No flat is assigned to your account");
        }
        return maintenanceRepository.findByFlatIdOrderByBillMonthDesc(resident.getFlat().getId())
                .stream().map(this::toResponse).toList();
    }

    // Admin sees all bills, optionally filtered by status.
    public List<MaintenanceResponse> all(MaintenanceStatus status) {
        List<Maintenance> bills = (status == null)
                ? maintenanceRepository.findAllByOrderByBillMonthDescIdDesc()
                : maintenanceRepository.findByStatusOrderByBillMonthDescIdDesc(status);
        return bills.stream().map(this::toResponse).toList();
    }

    // ---------- helpers ----------

    private LocalDate normalizeMonth(LocalDate date) {
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bill month is required");
        }
        return date.withDayOfMonth(1);
    }

    private BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private Maintenance newBill(Flat flat, LocalDate month, BigDecimal amount) {
        Maintenance bill = new Maintenance();
        bill.setFlat(flat);
        bill.setBillMonth(month);
        bill.setAmount(amount);
        bill.setStatus(MaintenanceStatus.PENDING);
        return bill;
    }

    private MaintenanceResponse toResponse(Maintenance m) {
        Flat f = m.getFlat();
        return new MaintenanceResponse(
                m.getId(), f.getId(), f.getBlockName() + "-" + f.getFlatNumber(),
                m.getBillMonth(), m.getAmount(), m.getStatus(), m.getPaidOn());
    }
}