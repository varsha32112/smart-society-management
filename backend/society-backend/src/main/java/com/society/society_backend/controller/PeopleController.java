package com.society.society_backend.controller;

import com.society.society_backend.dto.ActiveUpdate;
import com.society.society_backend.dto.PasswordReset;
import com.society.society_backend.dto.PersonRequest;
import com.society.society_backend.dto.PersonResponse;
import com.society.society_backend.service.UserAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/people")
public class PeopleController {

    private final UserAdminService userAdminService;

    public PeopleController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<PersonResponse> list() {
        return userAdminService.list();
    }

    @PostMapping
    public ResponseEntity<PersonResponse> create(@Valid @RequestBody PersonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userAdminService.create(request));
    }

    @PutMapping("/{id}/active")
    public PersonResponse setActive(@PathVariable Long id, @Valid @RequestBody ActiveUpdate update) {
        return userAdminService.setActive(id, update.active());
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordReset reset) {
        userAdminService.resetPassword(id, reset.newPassword());
        return ResponseEntity.noContent().build();
    }
}
