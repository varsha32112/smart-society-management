package com.society.society_backend.service;

import com.society.society_backend.dto.VerifyRequest;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.entity.Payment;
import com.society.society_backend.entity.PaymentStatus;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.PaymentRepository;
import com.society.society_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    PaymentRepository paymentRepository;
    @Mock
    MaintenanceRepository maintenanceRepository;
    @Mock
    UserRepository userRepository;

    PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(paymentRepository, maintenanceRepository, userRepository, "key_id", "secret");
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
        u.setEmail("r@x.com");
        u.setRole(Role.RESIDENT);
        u.setFlat(flat);
        return u;
    }

    private Payment pendingPayment(Flat billFlat) {
        Maintenance bill = new Maintenance();
        bill.setId(7L);
        bill.setFlat(billFlat);
        bill.setBillMonth(LocalDate.of(2026, 11, 1));
        bill.setAmount(new BigDecimal("2500.00"));
        bill.setStatus(MaintenanceStatus.PENDING);

        Payment p = new Payment();
        p.setBill(bill);
        p.setOrderId("order_1");
        p.setAmount(bill.getAmount());
        p.setStatus(PaymentStatus.CREATED);
        return p;
    }

    @Test
    void verify_rejectsAWrongSignature() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(resident(flat(1))));
        when(paymentRepository.findByOrderId("order_1")).thenReturn(Optional.of(pendingPayment(flat(1))));

        expectStatus(() -> service.verify(new VerifyRequest("order_1", "pay_1", "forged"), "r@x.com"), 400);
    }

    @Test
    void verify_marksThePaymentAndTheBillPaidForAValidSignature() {
        Payment payment = pendingPayment(flat(1));
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(resident(flat(1))));
        when(paymentRepository.findByOrderId("order_1")).thenReturn(Optional.of(payment));

        String signature = PaymentService.signatureFor("secret", "order_1", "pay_1");
        service.verify(new VerifyRequest("order_1", "pay_1", signature), "r@x.com");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getPaymentId()).isEqualTo("pay_1");
        assertThat(payment.getBill().getStatus()).isEqualTo(MaintenanceStatus.PAID);
        assertThat(payment.getBill().getPaidOn()).isEqualTo(LocalDate.now());
    }

    @Test
    void verify_isForbiddenForAResidentOfAnotherFlat() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(resident(flat(2))));
        when(paymentRepository.findByOrderId("order_1")).thenReturn(Optional.of(pendingPayment(flat(1))));

        String signature = PaymentService.signatureFor("secret", "order_1", "pay_1");
        expectStatus(() -> service.verify(new VerifyRequest("order_1", "pay_1", signature), "r@x.com"), 403);
    }
}