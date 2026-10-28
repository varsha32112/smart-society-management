package com.society.society_backend.controller;

import com.society.society_backend.dto.ComplaintRequest;
import com.society.society_backend.dto.ComplaintResponse;
import com.society.society_backend.dto.ComplaintStatusUpdate;
import com.society.society_backend.entity.ComplaintStatus;
import com.society.society_backend.service.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> raise(@RequestBody ComplaintRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(complaintService.raise(request, authentication.getName()));
    }

    @GetMapping("/my")
    public List<ComplaintResponse> myComplaints(Authentication authentication) {
        return complaintService.myComplaints(authentication.getName());
    }

    @GetMapping("/{id}")
    public ComplaintResponse getOne(@PathVariable Long id, Authentication authentication) {
        return complaintService.getById(id, authentication.getName());
    }

    @GetMapping
    public List<ComplaintResponse> all(@RequestParam(required = false) ComplaintStatus status) {
        return complaintService.all(status);
    }

    @PutMapping("/{id}/status")
    public ComplaintResponse updateStatus(@PathVariable Long id, @RequestBody ComplaintStatusUpdate update) {
        return complaintService.updateStatus(id, update);
    }
}