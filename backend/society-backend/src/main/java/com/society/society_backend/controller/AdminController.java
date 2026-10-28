package com.society.society_backend.controller;
import com.society.society_backend.dto.RegisterRequest;
import com.society.society_backend.dto.UserResponse;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> createSecurityStaff(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.password() == null || request.fullName() == null) {
            return ResponseEntity.badRequest().body("Name, email and password are required");
        }
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already registered");
        }

        User staff = new User();
        staff.setFullName(request.fullName());
        staff.setEmail(request.email());
        staff.setPhone(request.phone());
        staff.setPasswordHash(passwordEncoder.encode(request.password()));
        staff.setRole(Role.SECURITY);
        User saved = userRepository.save(staff);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole(), null));
    }
}
