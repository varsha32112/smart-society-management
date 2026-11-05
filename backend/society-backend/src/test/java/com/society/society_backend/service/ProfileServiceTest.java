package com.society.society_backend.service;

import com.society.society_backend.dto.PasswordChange;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static com.society.society_backend.TestSupport.expectStatus;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    PasswordEncoder passwordEncoder;
    @InjectMocks
    ProfileService service;

    private User userWithStoredHash() {
        User u = new User();
        u.setId(1L);
        u.setEmail("r@x.com");
        u.setRole(Role.RESIDENT);
        u.setPasswordHash("stored-hash");
        return u;
    }

    @Test
    void changePassword_refusesAWrongCurrentPassword() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(userWithStoredHash()));
        when(passwordEncoder.matches("wrong", "stored-hash")).thenReturn(false);

        // 400, not 401: a 401 would sign the person out of the app.
        expectStatus(() -> service.changePassword("r@x.com", new PasswordChange("wrong", "NewPass@456")), 400);
    }

    @Test
    void changePassword_refusesTheSamePasswordAgain() {
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(userWithStoredHash()));
        when(passwordEncoder.matches("Pass@123", "stored-hash")).thenReturn(true);

        expectStatus(() -> service.changePassword("r@x.com", new PasswordChange("Pass@123", "Pass@123")), 400);
    }

    @Test
    void changePassword_storesOnlyTheScrambledNewPassword() {
        User user = userWithStoredHash();
        when(userRepository.findByEmail("r@x.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Pass@123", "stored-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewPass@456")).thenReturn("new-hash");

        service.changePassword("r@x.com", new PasswordChange("Pass@123", "NewPass@456"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(userRepository).save(user);
    }
}
