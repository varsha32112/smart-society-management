package com.society.society_backend.repository;

import com.society.society_backend.entity.Payment;
import com.society.society_backend.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(String orderId);

    List<Payment> findByStatusAndBill_Flat_Id(PaymentStatus status, Long flatId);
}