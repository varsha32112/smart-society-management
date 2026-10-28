package com.society.society_backend.service;

import com.society.society_backend.dto.ComplaintRequest;
import com.society.society_backend.dto.ComplaintResponse;
import com.society.society_backend.dto.ComplaintStatusUpdate;
import com.society.society_backend.entity.Complaint;
import com.society.society_backend.entity.ComplaintStatus;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.ComplaintRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    // Resident raises a new complaint. Always starts as OPEN.
    @Transactional
    public ComplaintResponse raise(ComplaintRequest request, String residentEmail) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (request.title().length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 150 characters or fewer");
        }

        Complaint complaint = new Complaint();
        complaint.setResident(findUser(residentEmail));
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description());
        complaint.setStatus(ComplaintStatus.OPEN);

        return toResponse(complaintRepository.save(complaint));
    }

    // Resident sees only their own complaints.
    public List<ComplaintResponse> myComplaints(String residentEmail) {
        User resident = findUser(residentEmail);
        return complaintRepository.findByResidentIdOrderByIdDesc(resident.getId())
                .stream().map(this::toResponse).toList();
    }

    // Admin sees all complaints, optionally filtered by status.
    public List<ComplaintResponse> all(ComplaintStatus status) {
        List<Complaint> complaints = (status == null)
                ? complaintRepository.findAllByOrderByIdDesc()
                : complaintRepository.findByStatusOrderByIdDesc(status);
        return complaints.stream().map(this::toResponse).toList();
    }

    // A resident may read only their own complaint. An admin may read any.
    public ComplaintResponse getById(Long id, String email) {
        User user = findUser(email);
        Complaint complaint = findComplaint(id);

        if (user.getRole() == Role.RESIDENT && !complaint.getResident().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your complaint");
        }
        return toResponse(complaint);
    }

    // Admin moves the complaint forward and can leave a remark for the resident.
    @Transactional
    public ComplaintResponse updateStatus(Long id, ComplaintStatusUpdate update) {
        if (update.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        if (update.adminRemarks() != null && update.adminRemarks().length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks must be 255 characters or fewer");
        }

        Complaint complaint = findComplaint(id);
        ComplaintStatus current = complaint.getStatus();

        if (current == ComplaintStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Complaint is already resolved");
        }
        if (update.status().ordinal() < current.ordinal()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot move a complaint back from " + current + " to " + update.status());
        }

        complaint.setStatus(update.status());
        if (update.adminRemarks() != null) {
            complaint.setAdminRemarks(update.adminRemarks().trim());
        }
        return toResponse(complaintRepository.save(complaint));
    }

    // ---------- helpers ----------

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Complaint findComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    private ComplaintResponse toResponse(Complaint c) {
        User resident = c.getResident();
        Flat flat = resident.getFlat();
        String flatLabel = (flat == null) ? "-" : flat.getBlockName() + "-" + flat.getFlatNumber();
        return new ComplaintResponse(
                c.getId(), c.getTitle(), c.getDescription(), c.getStatus(), c.getAdminRemarks(),
                resident.getId(), resident.getFullName(), flatLabel, c.getCreatedAt());
    }
}
