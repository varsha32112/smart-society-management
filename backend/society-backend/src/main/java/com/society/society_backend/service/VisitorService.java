package com.society.society_backend.service;

import com.society.society_backend.dto.VisitorRequest;
import com.society.society_backend.dto.VisitorResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.User;
import com.society.society_backend.entity.Visitor;
import com.society.society_backend.entity.VisitorStatus;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.UserRepository;
import com.society.society_backend.repository.VisitorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VisitorService {

    private final VisitorRepository visitorRepository;
    private final FlatRepository flatRepository;
    private final UserRepository userRepository;

    public VisitorService(VisitorRepository visitorRepository,
                          FlatRepository flatRepository,
                          UserRepository userRepository) {
        this.visitorRepository = visitorRepository;
        this.flatRepository = flatRepository;
        this.userRepository = userRepository;
    }

    // Security guard registers a new visitor. Starts as PENDING.
    @Transactional
    public VisitorResponse register(VisitorRequest request, String guardEmail) {
        if (request.visitorName() == null || request.visitorName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visitor name is required");
        }
        if (request.flatId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flat is required");
        }

        Flat flat = flatRepository.findById(request.flatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flat not found"));
        User guard = findUser(guardEmail);

        Visitor visitor = new Visitor();
        visitor.setVisitorName(request.visitorName().trim());
        visitor.setVisitorPhone(request.visitorPhone());
        visitor.setPurpose(request.purpose());
        visitor.setFlat(flat);
        visitor.setRegisteredBy(guard);
        visitor.setStatus(VisitorStatus.PENDING);

        return toResponse(visitorRepository.save(visitor));
    }

    // Resident sees visitors for their own flat, optionally filtered by status.
    public List<VisitorResponse> myVisitors(String residentEmail, VisitorStatus status) {
        Long flatId = residentFlatId(findUser(residentEmail));
        List<Visitor> visitors = (status == null)
                ? visitorRepository.findByFlatIdOrderByIdDesc(flatId)
                : visitorRepository.findByFlatIdAndStatusOrderByIdDesc(flatId, status);
        return visitors.stream().map(this::toResponse).toList();
    }

    // Resident approves or rejects a visitor for their own flat.
    @Transactional
    public VisitorResponse decide(Long visitorId, String residentEmail, boolean approve) {
        Visitor visitor = findVisitor(visitorId);
        Long residentFlatId = residentFlatId(findUser(residentEmail));

        if (!visitor.getFlat().getId().equals(residentFlatId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This visitor is not for your flat");
        }
        if (visitor.getStatus() != VisitorStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Visitor already " + visitor.getStatus());
        }

        visitor.setStatus(approve ? VisitorStatus.APPROVED : VisitorStatus.REJECTED);
        return toResponse(visitorRepository.save(visitor));
    }

    // Guard records the moment the visitor enters. Only allowed once approved.
    @Transactional
    public VisitorResponse recordEntry(Long visitorId) {
        Visitor visitor = findVisitor(visitorId);

        if (visitor.getStatus() != VisitorStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Visitor is not approved");
        }
        if (visitor.getEntryTime() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Entry already recorded");
        }

        visitor.setEntryTime(LocalDateTime.now());
        return toResponse(visitorRepository.save(visitor));
    }

    // Guard records the moment the visitor leaves. Only allowed after entry.
    @Transactional
    public VisitorResponse recordExit(Long visitorId) {
        Visitor visitor = findVisitor(visitorId);

        if (visitor.getEntryTime() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Entry has not been recorded yet");
        }
        if (visitor.getExitTime() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exit already recorded");
        }

        visitor.setExitTime(LocalDateTime.now());
        return toResponse(visitorRepository.save(visitor));
    }

    public VisitorResponse getById(Long visitorId) {
        return toResponse(findVisitor(visitorId));
    }

    public List<VisitorResponse> getAll() {
        return visitorRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    // ---------- helpers ----------

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Visitor findVisitor(Long id) {
        return visitorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visitor not found"));
    }

    private Long residentFlatId(User resident) {
        if (resident.getFlat() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No flat is assigned to your account");
        }
        return resident.getFlat().getId();
    }

    private VisitorResponse toResponse(Visitor v) {
        Flat f = v.getFlat();
        return new VisitorResponse(
                v.getId(), v.getVisitorName(), v.getVisitorPhone(), v.getPurpose(),
                f.getId(), f.getBlockName() + "-" + f.getFlatNumber(),
                v.getStatus(), v.getEntryTime(), v.getExitTime(), v.getCreatedAt());
    }
}