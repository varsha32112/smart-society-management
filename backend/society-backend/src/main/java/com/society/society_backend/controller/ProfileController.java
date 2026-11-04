package com.society.society_backend.controller;

import com.society.society_backend.dto.PasswordChange;
import com.society.society_backend.dto.PersonResponse;
import com.society.society_backend.dto.ProfileUpdate;
import com.society.society_backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public PersonResponse get(Authentication authentication) {
        return profileService.get(authentication.getName());
    }

    @PutMapping
    public PersonResponse update(@Valid @RequestBody ProfileUpdate update, Authentication authentication) {
        return profileService.update(authentication.getName(), update);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChange change,
                                               Authentication authentication) {
        profileService.changePassword(authentication.getName(), change);
        return ResponseEntity.noContent().build();
    }
}
