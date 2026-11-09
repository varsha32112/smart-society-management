package com.society.society_backend.service;

import com.society.society_backend.dto.UpiClaimRequest;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.UpiClaim;
import com.society.society_backend.entity.UpiClaimStatus;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UpiClaimRepository;
import com.society.society_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.ArgumentMatchers.any;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpiServiceTest {

    @Mock
    UpiClaimRepository claimRepository;
    @Mock
    MaintenanceRepository maintenanceRepository;
    @Mock
    UserRepository userRepository;

    UpiService service;

    @BeforeEach
    void setUp() {
        service = new UpiService(claimRepository, maintenanceRepository, userRepository, "society@bank", "Society");
    }

    private Flat flat(long id) {
        Flat f = new Flat();
        f.setId(id);
        f.setBlockName("A");
        f.setFlatNumber("10" + id);
        return f;
    }

    private User resident(Flat flat) {
        User u = new User();
        u.setId(1L);
        u.setFullName("Ravi Kumar");
        u.setEmail("r@x.com");
        u.setRole(Role.RESIDENT);
        u.setFlat(flat);
        return u;
    }

    private Maintenance bill(Flat flat, MaintenanceStatus status) {
        Maintenance m = new Maintenance();
        m.setId(7L);
        m.setFlat(flat);
        m.setBillMonth(LocalDate.of(2026, 11, 1));
        m.setAmount(new BigDecimal("2500.00"));
        m.setStatus(status);
        return m;
    }

    private UpiClaim claim(Maintenance bill) {
        UpiClaim c = new UpiClaim();
        c.setId(5L);
        c.setBill(bill);
        c.setResident(resident(bill.getFlat()));
        c.setUtr("123456789012");
        c.setAmount(bill.getAmount());
        c.setStatus(UpiClaimStatus.CLAIMED);
        return c;
    }

    @Test
    void submit_refusesAReferenceNumberThatWasAlreadyUsed() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(resident(flat(1))));
        when(maintenanceRepository.findById(7L)).thenReturn(Optional.of(bill(flat(1), MaintenanceStatus.PENDING)));
        when(claimRepository.existsByUtr("123456789012")).thenReturn(true);

        expectStatus(() -> service.submitClaim(new UpiClaimRequest(7L, "123456789012"), "r@x.com"), 409);
    }

    @Test
    void submit_isForbiddenForABillOfAnotherFlat() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(resident(flat(2))));
        when(maintenanceRepository.findById(7L)).thenReturn(Optional.of(bill(flat(1), MaintenanceStatus.PENDING)));

        expectStatus(() -> service.submitClaim(new UpiClaimRequest(7L, "123456789012"), "r@x.com"), 403);
    }

    @Test
    void confirm_marksTheClaimConfirmedAndTheBillPaid() {
        UpiClaim claim = claim(bill(flat(1), MaintenanceStatus.PENDING));
        when(claimRepository.findById(5L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(UpiClaim.class))).thenAnswer(inv -> inv.getArgument(0));

        service.confirm(5L);

        assertThat(claim.getStatus()).isEqualTo(UpiClaimStatus.CONFIRMED);
        assertThat(claim.getBill().getStatus()).isEqualTo(MaintenanceStatus.PAID);
        assertThat(claim.getBill().getPaidOn()).isEqualTo(LocalDate.now());
    }
    @Test
    void confirm_isRefusedWhenTheBillWasAlreadyPaid() {
        when(claimRepository.findById(5L))
                .thenReturn(Optional.of(claim(bill(flat(1), MaintenanceStatus.PAID))));

        expectStatus(() -> service.confirm(5L), 409);
    }

    @Test
    void reject_requiresAReason() {
        expectStatus(() -> service.reject(5L, "  "), 400);
    }
}
