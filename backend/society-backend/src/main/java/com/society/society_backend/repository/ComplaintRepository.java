package com.society.society_backend.repository;
import com.society.society_backend.entity.Complaint;
import com.society.society_backend.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface ComplaintRepository extends JpaRepository<Complaint, Long>{
    List<Complaint> findByResidentIdOrderByIdDesc(Long residentId);

    List<Complaint> findByStatusOrderByIdDesc(ComplaintStatus status);

    List<Complaint> findAllByOrderByIdDesc();
}
