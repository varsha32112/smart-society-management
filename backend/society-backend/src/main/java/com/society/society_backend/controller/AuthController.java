package com.society.society_backend.controller;

import com.society.society_backend.dto.AuthResponse;
import com.society.society_backend.dto.LoginRequest;
import com.society.society_backend.dto.RegisterRequest;
import com.society.society_backend.dto.UserResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.UserRepository;
import com.society.society_backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          FlatRepository flatRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.RESIDENT);   // public sign-up is always a resident

        if (request.flatId() != null) {
            Flat flat = flatRepository.findById(request.flatId()).orElse(null);
            if (flat == null) {
                return ResponseEntity.badRequest().body("Flat not found");
            }
            user.setFlat(flat);
        }

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }
        if (!Boolean.TRUE.equals(user.getActive())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is disabled");
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, toResponse(user)));
    }

    private UserResponse toResponse(User user) {
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), flatId);
    }
}