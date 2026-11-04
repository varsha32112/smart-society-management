package com.society.society_backend.repository;
import com.society.society_backend.entity.Visitor;
import com.society.society_backend.entity.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
public interface VisitorRepository extends JpaRepository<Visitor, Long>{
    List<Visitor> findByFlatIdOrderByIdDesc(Long flatId);

    List<Visitor> findByFlatIdAndStatusOrderByIdDesc(Long flatId, VisitorStatus status);
    List<Visitor> findTop50ByOrderByIdDesc();
    List<Visitor> findAllByOrderByIdDesc();
    boolean existsByFlatId(Long flatId);
    long countByStatus(VisitorStatus status);

    long countByEntryTimeIsNotNullAndExitTimeIsNull();

    long countByEntryTimeGreaterThanEqual(LocalDateTime time);

    List<Visitor> findTop500ByOrderByIdDesc();
}
