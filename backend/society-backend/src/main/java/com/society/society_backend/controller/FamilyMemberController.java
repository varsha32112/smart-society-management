package com.society.society_backend.controller;

import com.society.society_backend.dto.FamilyMemberRequest;
import com.society.society_backend.dto.FamilyMemberResponse;
import com.society.society_backend.service.FamilyMemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
public class FamilyMemberController {

    private final FamilyMemberService familyMemberService;

    public FamilyMemberController(FamilyMemberService familyMemberService) {
        this.familyMemberService = familyMemberService;
    }

    @PostMapping
    public ResponseEntity<FamilyMemberResponse> add(@RequestBody FamilyMemberRequest request,
                                                    Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(familyMemberService.add(request, authentication.getName()));
    }

    @GetMapping
    public List<FamilyMemberResponse> list(Authentication authentication) {
        return familyMemberService.list(authentication.getName());
    }

    @PutMapping("/{id}")
    public FamilyMemberResponse update(@PathVariable Long id,
                                       @RequestBody FamilyMemberRequest request,
                                       Authentication authentication) {
        return familyMemberService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        familyMemberService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}