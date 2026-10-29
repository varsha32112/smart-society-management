package com.society.society_backend.service;

import com.society.society_backend.dto.FamilyMemberRequest;
import com.society.society_backend.dto.FamilyMemberResponse;
import com.society.society_backend.entity.FamilyMember;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.FamilyMemberRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FamilyMemberService {

    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    public FamilyMemberService(FamilyMemberRepository familyMemberRepository, UserRepository userRepository) {
        this.familyMemberRepository = familyMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FamilyMemberResponse add(FamilyMemberRequest request, String residentEmail) {
        validate(request);
        FamilyMember member = new FamilyMember();
        member.setResident(findUser(residentEmail));
        apply(member, request);
        return toResponse(familyMemberRepository.save(member));
    }

    public List<FamilyMemberResponse> list(String residentEmail) {
        User resident = findUser(residentEmail);
        return familyMemberRepository.findByResidentIdOrderByIdAsc(resident.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public FamilyMemberResponse update(Long id, FamilyMemberRequest request, String residentEmail) {
        validate(request);
        FamilyMember member = findOwned(id, findUser(residentEmail));
        apply(member, request);
        return toResponse(familyMemberRepository.save(member));
    }

    @Transactional
    public void delete(Long id, String residentEmail) {
        FamilyMember member = findOwned(id, findUser(residentEmail));
        familyMemberRepository.delete(member);
    }

    // ---------- helpers ----------

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    // The ownership rule: a resident can only touch their own family members.
    private FamilyMember findOwned(Long id, User resident) {
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family member not found"));
        if (!member.getResident().getId().equals(resident.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This family member is not yours");
        }
        return member;
    }

    private void validate(FamilyMemberRequest request) {
        if (request.fullName() == null || request.fullName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (request.fullName().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be 100 characters or fewer");
        }
        if (request.relation() != null && request.relation().length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Relation must be 30 characters or fewer");
        }
        if (request.phone() != null && !request.phone().isBlank()
                && !request.phone().matches("[0-9+\\- ]{7,15}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone must be 7 to 15 digits");
        }
    }

    private void apply(FamilyMember member, FamilyMemberRequest request) {
        member.setFullName(request.fullName().trim());
        member.setRelation(request.relation());
        member.setPhone(request.phone());
    }

    private FamilyMemberResponse toResponse(FamilyMember m) {
        return new FamilyMemberResponse(m.getId(), m.getFullName(), m.getRelation(), m.getPhone());
    }
}