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
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final boolean publicRegistration;

    public AuthController(UserRepository userRepository,
                          FlatRepository flatRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          @Value("${society.public-registration:false}") boolean publicRegistration) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.publicRegistration = publicRegistration;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (!publicRegistration) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Registration is closed. Please contact the society office.");
        }

        String email = request.email().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        Flat flat = flatRepository.findById(request.flatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected flat does not exist"));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.RESIDENT);
        user.setFlat(flat);

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is disabled");
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, toResponse(user)));
    }

    private UserResponse toResponse(User user) {
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), flatId);
    }
}