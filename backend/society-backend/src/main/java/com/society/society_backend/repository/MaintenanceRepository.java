package com.society.society_backend.repository;

import com.society.society_backend.entity.Maintenance;
import com.society.society_backend.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findByFlatIdOrderByBillMonthDesc(Long flatId);

    List<Maintenance> findByStatusOrderByBillMonthDescIdDesc(MaintenanceStatus status);

    List<Maintenance> findAllByOrderByBillMonthDescIdDesc();
    boolean existsByFlatId(Long flatId);
    long countByStatus(MaintenanceStatus status);

    @Query("select sum(m.amount) from Maintenance m where m.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") MaintenanceStatus status);

    boolean existsByFlatIdAndBillMonth(Long flatId, LocalDate billMonth);
}