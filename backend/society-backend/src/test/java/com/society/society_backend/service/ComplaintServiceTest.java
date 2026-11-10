package com.society.society_backend.service;

import com.society.society_backend.dto.ComplaintRequest;
import com.society.society_backend.dto.ComplaintResponse;
import com.society.society_backend.dto.ComplaintStatusUpdate;
import com.society.society_backend.entity.Complaint;
import com.society.society_backend.entity.ComplaintStatus;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.ComplaintRepository;
import com.society.society_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.society.society_backend.dto.TaskResponse;

import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    ComplaintRepository complaintRepository;
    @Mock
    UserRepository userRepository;
    @InjectMocks
    ComplaintService service;

    private User user(long id, Role role) {
        User u = new User();
        u.setId(id);
        u.setFullName("User " + id);
        u.setEmail("user" + id + "@x.com");
        u.setRole(role);
        return u;
    }

    private Complaint complaint(long id, User owner, ComplaintStatus status) {
        Complaint c = new Complaint();
        c.setId(id);
        c.setResident(owner);
        c.setTitle("Lift not working");
        c.setStatus(status);
        return c;
    }

    // ----- raising -----

    @Test
    void raise_rejectsABlankTitle() {
        expectStatus(() -> service.raise(new ComplaintRequest("  ", "details"), "r@x.com"), 400);
    }

    @Test
    void raise_rejectsATitleLongerThan150Characters() {
        expectStatus(() -> service.raise(new ComplaintRequest("x".repeat(151), null), "r@x.com"), 400);
    }

    // ----- the status can only move forward -----

    @Test
    void status_cannotMoveBackwards() {
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.IN_PROGRESS)));

        expectStatus(() -> service.updateStatus(1L, new ComplaintStatusUpdate(ComplaintStatus.OPEN, null)), 409);
    }

    @Test
    void aResolvedComplaintIsLocked() {
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.RESOLVED)));

        expectStatus(() -> service.updateStatus(1L, new ComplaintStatusUpdate(ComplaintStatus.RESOLVED, "again")), 409);
    }

    @Test
    void status_movesForwardAndStoresTheTrimmedRemark() {
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN)));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintResponse response = service.updateStatus(1L,
                new ComplaintStatusUpdate(ComplaintStatus.IN_PROGRESS, "  Plumber booked  "));

        assertThat(response.status()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        assertThat(response.adminRemarks()).isEqualTo("Plumber booked");
    }

    // ----- who may read a complaint -----

    @Test
    void aResidentCannotReadAnotherResidentsComplaint() {
        when(userRepository.findByEmail("other@x.com")).thenReturn(Optional.of(user(2, Role.RESIDENT)));
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN)));

        expectStatus(() -> service.getById(1L, "other@x.com"), 403);
    }
    // ----- housekeeping -----

    @Test
    void assign_refusesSomeoneWhoIsNotHousekeepingStaff() {
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN)));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5, Role.SECURITY)));

        expectStatus(() -> service.assign(1L, 5L), 400);
    }

    @Test
    void staff_cannotUpdateATaskAssignedToSomeoneElse() {
        Complaint task = complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN);
        task.setAssignedTo(user(7, Role.HOUSEKEEPING));
        when(userRepository.findByEmail("staff@x.com")).thenReturn(Optional.of(user(8, Role.HOUSEKEEPING)));
        when(complaintRepository.findById(1L)).thenReturn(Optional.of(task));

        expectStatus(() -> service.updateByStaff(1L, "staff@x.com",
                new ComplaintStatusUpdate(ComplaintStatus.IN_PROGRESS, null)), 403);
    }

    @Test
    void staff_canMoveTheirOwnTaskForwardButNotBackToOpen() {
        User staff = user(8, Role.HOUSEKEEPING);
        Complaint task = complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN);
        task.setAssignedTo(staff);
        when(userRepository.findByEmail("staff@x.com")).thenReturn(Optional.of(staff));
        when(complaintRepository.findById(1L)).thenReturn(Optional.of(task));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        expectStatus(() -> service.updateByStaff(1L, "staff@x.com",
                new ComplaintStatusUpdate(ComplaintStatus.OPEN, "x")), 400);

        TaskResponse result = service.updateByStaff(1L, "staff@x.com",
                new ComplaintStatusUpdate(ComplaintStatus.IN_PROGRESS, "On it"));
        assertThat(result.status()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        assertThat(result.remarks()).isEqualTo("On it");
    }

    @Test
    void anAdminCanReadAnyComplaint() {
        when(userRepository.findByEmail("admin@x.com")).thenReturn(Optional.of(user(3, Role.ADMIN)));
        when(complaintRepository.findById(1L))
                .thenReturn(Optional.of(complaint(1, user(1, Role.RESIDENT), ComplaintStatus.OPEN)));

        assertThat(service.getById(1L, "admin@x.com").title()).isEqualTo("Lift not working");
    }
}
