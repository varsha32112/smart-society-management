package com.society.society_backend.service;

import com.society.society_backend.dto.BulkGenerateResult;
import com.society.society_backend.dto.BulkMaintenanceRequest;
import com.society.society_backend.dto.MaintenanceRequest;
import com.society.society_backend.dto.MaintenanceResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    MaintenanceRepository maintenanceRepository;
    @Mock
    FlatRepository flatRepository;
    @Mock
    UserRepository userRepository;
    @InjectMocks
    MaintenanceService service;

    private Flat flat(long id) {
        Flat f = new Flat();
        f.setId(id);
        f.setBlockName("A");
        f.setFlatNumber("10" + id);
        return f;
    }

    private Maintenance bill(long id, MaintenanceStatus status) {
        Maintenance m = new Maintenance();
        m.setId(id);
        m.setFlat(flat(1));
        m.setBillMonth(LocalDate.of(2026, 11, 1));
        m.setAmount(new BigDecimal("2500.00"));
        m.setStatus(status);
        return m;
    }

    @Test
    void create_storesTheMonthAsTheFirstAndTheAmountToTwoDecimals() {
        when(flatRepository.findById(1L)).thenReturn(Optional.of(flat(1)));
        when(maintenanceRepository.existsByFlatIdAndBillMonth(1L, LocalDate.of(2026, 11, 1))).thenReturn(false);
        when(maintenanceRepository.save(any(Maintenance.class))).thenAnswer(inv -> inv.getArgument(0));

        MaintenanceResponse response = service.create(
                new MaintenanceRequest(1L, LocalDate.of(2026, 11, 15), new BigDecimal("2500.5")));

        assertThat(response.billMonth()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(response.amount()).isEqualByComparingTo("2500.50");
        assertThat(response.status()).isEqualTo(MaintenanceStatus.PENDING);
    }

    @Test
    void create_refusesASecondBillForTheSameFlatAndMonth() {
        when(flatRepository.findById(1L)).thenReturn(Optional.of(flat(1)));
        when(maintenanceRepository.existsByFlatIdAndBillMonth(1L, LocalDate.of(2026, 11, 1))).thenReturn(true);

        expectStatus(() -> service.create(
                new MaintenanceRequest(1L, LocalDate.of(2026, 11, 1), new BigDecimal("2500"))), 409);
    }

    @Test
    void create_refusesAnAmountOfZero() {
        expectStatus(() -> service.create(
                new MaintenanceRequest(1L, LocalDate.of(2026, 11, 1), BigDecimal.ZERO)), 400);
    }

    @Test
    void generateForAll_skipsFlatsThatAlreadyHaveABill() {
        LocalDate month = LocalDate.of(2026, 12, 1);
        when(flatRepository.findAll()).thenReturn(List.of(flat(1), flat(2)));
        when(maintenanceRepository.existsByFlatIdAndBillMonth(1L, month)).thenReturn(true);
        when(maintenanceRepository.existsByFlatIdAndBillMonth(2L, month)).thenReturn(false);

        BulkGenerateResult result = service.generateForAll(
                new BulkMaintenanceRequest(LocalDate.of(2026, 12, 20), new BigDecimal("2500")));

        assertThat(result.created()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        verify(maintenanceRepository, times(1)).save(any(Maintenance.class));
    }

    @Test
    void markPaid_setsPaidAndRecordsTodaysDate() {
        when(maintenanceRepository.findById(7L)).thenReturn(Optional.of(bill(7, MaintenanceStatus.PENDING)));
        when(maintenanceRepository.save(any(Maintenance.class))).thenAnswer(inv -> inv.getArgument(0));

        MaintenanceResponse response = service.markPaid(7L);

        assertThat(response.status()).isEqualTo(MaintenanceStatus.PAID);
        assertThat(response.paidOn()).isEqualTo(LocalDate.now());
    }

    @Test
    void markPaid_cannotBeDoneTwice() {
        when(maintenanceRepository.findById(7L)).thenReturn(Optional.of(bill(7, MaintenanceStatus.PAID)));

        expectStatus(() -> service.markPaid(7L), 409);
    }
}
