package com.society.society_backend.service;

import com.society.society_backend.dto.PasswordChange;
import com.society.society_backend.dto.PersonResponse;
import com.society.society_backend.dto.ProfileUpdate;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public PersonResponse get(String email) {
        return toResponse(find(email));
    }

    @Transactional
    public PersonResponse update(String email, ProfileUpdate update) {
        User user = find(email);
        user.setFullName(update.fullName().trim());
        user.setPhone(update.phone() == null || update.phone().isBlank() ? null : update.phone().trim());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, PasswordChange change) {
        User user = find(email);

        // 400, not 401: a 401 would make the screen think the session expired and sign the user out.
        if (!passwordEncoder.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (change.currentPassword().equals(change.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(change.newPassword()));
        userRepository.save(user);
    }

    private User find(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
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
