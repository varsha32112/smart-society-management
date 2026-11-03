package com.society.society_backend.service;

import com.society.society_backend.dto.PersonRequest;
import com.society.society_backend.dto.PersonResponse;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.Role;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserAdminService {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(UserRepository userRepository,
                            FlatRepository flatRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<PersonResponse> list() {
        return userRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PersonResponse create(PersonRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only resident and security accounts can be created here");
        }

        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setActive(true);

        if (request.role() == Role.RESIDENT) {
            if (request.flatId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a flat for the resident");
            }
            Flat flat = flatRepository.findById(request.flatId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "The selected flat does not exist"));
            user.setFlat(flat);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public PersonResponse setActive(Long id, boolean active) {
        User user = manageable(id);
        user.setActive(active);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = manageable(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Admin accounts are protected: they cannot be changed from the People screen.
    private User manageable(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin accounts cannot be changed here");
        }
        return user;
    }

    private PersonResponse toResponse(User u) {
        Flat flat = u.getFlat();
        return new PersonResponse(
                u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(),
                flat == null ? null : flat.getId(),
                flat == null ? null : flat.getBlockName() + "-" + flat.getFlatNumber(),
                Boolean.TRUE.equals(u.getActive()),
                u.getCreatedAt());
    }
}
