package com.society.society_backend.repository;

import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findByFlatIdOrderByBillMonthDesc(Long flatId);

    List<Maintenance> findByStatusOrderByBillMonthDescIdDesc(MaintenanceStatus status);

    List<Maintenance> findAllByOrderByBillMonthDescIdDesc();

    boolean existsByFlatIdAndBillMonth(Long flatId, LocalDate billMonth);
}