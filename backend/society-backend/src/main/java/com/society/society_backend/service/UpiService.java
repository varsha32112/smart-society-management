package com.society.society_backend.service;

import com.society.society_backend.dto.UpiClaimRequest;
import com.society.society_backend.dto.UpiClaimResponse;
import com.society.society_backend.dto.UpiConfig;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.UpiClaim;
import com.society.society_backend.entity.UpiClaimStatus;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UpiClaimRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class UpiService {

    private final UpiClaimRepository claimRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final String upiId;
    private final String payeeName;

    public UpiService(UpiClaimRepository claimRepository,
                      MaintenanceRepository maintenanceRepository,
                      UserRepository userRepository,
                      @Value("${society.upi.id:}") String upiId,
                      @Value("${society.upi.name:Smart Society}") String payeeName) {
        this.claimRepository = claimRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.upiId = upiId == null ? "" : upiId.trim();
        this.payeeName = payeeName == null || payeeName.isBlank() ? "Smart Society" : payeeName.trim();
    }

    public UpiConfig config() {
        boolean enabled = !upiId.isBlank();
        return new UpiConfig(enabled, enabled ? upiId : null, enabled ? payeeName : null);
    }

    // ---------- resident ----------

    @Transactional
    public UpiClaimResponse submitClaim(UpiClaimRequest request, String residentEmail) {
        if (upiId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "UPI payment is not set up yet");
        }
        User resident = findResident(residentEmail);
        Maintenance bill = maintenanceRepository.findById(request.billId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (!bill.getFlat().getId().equals(resident.getFlat().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This bill is not for your flat");
        }
        if (bill.getStatus() != MaintenanceStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This bill is already paid");
        }

        String utr = request.utr().trim();
        if (claimRepository.existsByUtr(utr)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This reference number has already been submitted");
        }
        if (claimRepository.existsByBillIdAndStatus(bill.getId(), UpiClaimStatus.CLAIMED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A payment claim for this bill is already waiting for confirmation");
        }

        UpiClaim claim = new UpiClaim();
        claim.setBill(bill);
        claim.setResident(resident);
        claim.setUtr(utr);
        claim.setAmount(bill.getAmount());
        claim.setStatus(UpiClaimStatus.CLAIMED);
        return toResponse(claimRepository.save(claim));
    }

    public List<UpiClaimResponse> myClaims(String residentEmail) {
        User resident = findResident(residentEmail);
        return claimRepository.findByBill_Flat_IdOrderByIdDesc(resident.getFlat().getId())
                .stream().map(this::toResponse).toList();
    }

    // ---------- admin ----------

    public List<UpiClaimResponse> list(UpiClaimStatus status) {
        List<UpiClaim> claims = status == null
                ? claimRepository.findTop200ByOrderByIdDesc()
                : claimRepository.findByStatusOrderByIdDesc(status);
        return claims.stream().map(this::toResponse).toList();
    }

    @Transactional
    public UpiClaimResponse confirm(Long id) {
        UpiClaim claim = findClaim(id);
        requireWaiting(claim);

        Maintenance bill = claim.getBill();
        if (bill.getStatus() != MaintenanceStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This bill is already paid. Reject this claim, or arrange a refund");
        }

        bill.setStatus(MaintenanceStatus.PAID);
        bill.setPaidOn(LocalDate.now());
        maintenanceRepository.save(bill);

        claim.setStatus(UpiClaimStatus.CONFIRMED);
        claim.setDecidedAt(LocalDateTime.now());
        return toResponse(claimRepository.save(claim));
    }

    @Transactional
    public UpiClaimResponse reject(Long id, String note) {
        if (note == null || note.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please give a reason");
        }
        UpiClaim claim = findClaim(id);
        requireWaiting(claim);

        claim.setStatus(UpiClaimStatus.REJECTED);
        claim.setNote(note.trim());
        claim.setDecidedAt(LocalDateTime.now());
        return toResponse(claimRepository.save(claim));
    }

    // ---------- helpers ----------

    private UpiClaim findClaim(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private void requireWaiting(UpiClaim claim) {
        if (claim.getStatus() != UpiClaimStatus.CLAIMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This claim was already " + claim.getStatus());
        }
    }

    private User findResident(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getFlat() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No flat is assigned to your account");
        }
        return user;
    }

    private UpiClaimResponse toResponse(UpiClaim c) {
        Flat flat = c.getBill().getFlat();
        return new UpiClaimResponse(
                c.getId(), c.getBill().getId(),
                flat.getBlockName() + "-" + flat.getFlatNumber(),
                c.getBill().getBillMonth(), c.getAmount(),
                c.getResident().getFullName(), c.getUtr(),
                c.getStatus(), c.getNote(), c.getCreatedAt(), c.getDecidedAt());
    }
}
