package com.society.society_backend.service;

import com.society.society_backend.dto.VisitorRequest;
import com.society.society_backend.dto.VisitorResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.entity.Visitor;
import com.society.society_backend.entity.VisitorStatus;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.UserRepository;
import com.society.society_backend.repository.VisitorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitorServiceTest {

    @Mock
    VisitorRepository visitorRepository;
    @Mock
    FlatRepository flatRepository;
    @Mock
    UserRepository userRepository;
    @InjectMocks
    VisitorService service;

    // ----- helpers that build test data -----

    private Flat flat(long id) {
        Flat f = new Flat();
        f.setId(id);
        f.setBlockName("A");
        f.setFlatNumber("10" + id);
        return f;
    }

    private User user(long id, Role role, Flat flat) {
        User u = new User();
        u.setId(id);
        u.setEmail("user" + id + "@x.com");
        u.setRole(role);
        u.setFlat(flat);
        return u;
    }

    private Visitor visitor(long id, Flat flat, VisitorStatus status) {
        Visitor v = new Visitor();
        v.setId(id);
        v.setVisitorName("Guest");
        v.setFlat(flat);
        v.setStatus(status);
        return v;
    }

    private void saveReturnsTheSameVisitor() {
        when(visitorRepository.save(any(Visitor.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ----- registering -----

    @Test
    void register_rejectsABlankName() {
        expectStatus(() -> service.register(new VisitorRequest("  ", null, null, 1L), "guard@x.com"), 400);
    }

    @Test
    void register_createsAPendingVisitorForTheChosenFlat() {
        when(flatRepository.findById(1L)).thenReturn(Optional.of(flat(1)));
        when(userRepository.findByEmail("guard@x.com")).thenReturn(Optional.of(user(9, Role.SECURITY, null)));
        saveReturnsTheSameVisitor();

        VisitorResponse response = service.register(
                new VisitorRequest(" Rahul ", "9000000001", "Delivery", 1L), "guard@x.com");

        assertThat(response.visitorName()).isEqualTo("Rahul");
        assertThat(response.status()).isEqualTo(VisitorStatus.PENDING);
        assertThat(response.flatLabel()).isEqualTo("A-101");
    }

    // ----- the resident's decision -----

    @Test
    void approve_isForbiddenForAResidentOfAnotherFlat() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.PENDING)));
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(user(2, Role.RESIDENT, flat(2))));

        expectStatus(() -> service.decide(5L, "r@x.com", true), 403);
    }

    @Test
    void decide_failsWhenTheVisitorWasAlreadyDecided() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.APPROVED)));
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(user(2, Role.RESIDENT, flat(1))));

        expectStatus(() -> service.decide(5L, "r@x.com", false), 409);
    }

    @Test
    void approve_marksAPendingVisitorAsApproved() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.PENDING)));
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(user(2, Role.RESIDENT, flat(1))));
        saveReturnsTheSameVisitor();

        assertThat(service.decide(5L, "r@x.com", true).status()).isEqualTo(VisitorStatus.APPROVED);
    }

    // ----- entry and exit -----

    @Test
    void entry_isRefusedBeforeApproval() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.PENDING)));

        expectStatus(() -> service.recordEntry(5L), 409);
    }

    @Test
    void entry_isRecordedOnceApproved() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.APPROVED)));
        saveReturnsTheSameVisitor();

        assertThat(service.recordEntry(5L).entryTime()).isNotNull();
    }

    @Test
    void exit_isRefusedBeforeEntry() {
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(visitor(5, flat(1), VisitorStatus.APPROVED)));

        expectStatus(() -> service.recordExit(5L), 409);
    }

    @Test
    void exit_isRecordedAfterEntry() {
        Visitor inside = visitor(5, flat(1), VisitorStatus.APPROVED);
        inside.setEntryTime(LocalDateTime.now().minusHours(1));
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(inside));
        saveReturnsTheSameVisitor();

        assertThat(service.recordExit(5L).exitTime()).isNotNull();
    }

    @Test
    void exit_cannotBeRecordedTwice() {
        Visitor left = visitor(5, flat(1), VisitorStatus.APPROVED);
        left.setEntryTime(LocalDateTime.now().minusHours(2));
        left.setExitTime(LocalDateTime.now().minusHours(1));
        when(visitorRepository.findById(5L)).thenReturn(Optional.of(left));

        expectStatus(() -> service.recordExit(5L), 409);
    }
}