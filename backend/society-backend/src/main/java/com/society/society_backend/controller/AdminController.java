package com.society.society_backend.controller;

import com.society.society_backend.dto.StaffRequest;
import com.society.society_backend.dto.UserResponse;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/staff")
    public ResponseEntity<UserResponse> createSecurityStaff(@Valid @RequestBody StaffRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User staff = new User();
        staff.setFullName(request.fullName().trim());
        staff.setEmail(email);
        staff.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        staff.setPasswordHash(passwordEncoder.encode(request.password()));
        staff.setRole(Role.SECURITY);
        User saved = userRepository.save(staff);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole(), null));
    }
}