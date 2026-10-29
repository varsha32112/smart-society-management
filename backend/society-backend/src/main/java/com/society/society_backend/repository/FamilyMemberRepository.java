package com.society.society_backend.repository;

import com.society.society_backend.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    List<FamilyMember> findByResidentIdOrderByIdAsc(Long residentId);
}