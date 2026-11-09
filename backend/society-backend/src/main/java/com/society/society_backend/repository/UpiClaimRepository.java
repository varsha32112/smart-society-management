package com.society.society_backend.repository;

import com.society.society_backend.entity.UpiClaim;
import com.society.society_backend.entity.UpiClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UpiClaimRepository extends JpaRepository<UpiClaim, Long> {

    boolean existsByUtr(String utr);

    boolean existsByBillIdAndStatus(Long billId, UpiClaimStatus status);

    List<UpiClaim> findByBill_Flat_IdOrderByIdDesc(Long flatId);

    List<UpiClaim> findByStatusOrderByIdDesc(UpiClaimStatus status);

    List<UpiClaim> findTop200ByOrderByIdDesc();
}
