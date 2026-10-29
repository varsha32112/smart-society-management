package com.society.society_backend.controller;

import com.society.society_backend.dto.BulkGenerateResult;
import com.society.society_backend.dto.BulkMaintenanceRequest;
import com.society.society_backend.dto.MaintenanceRequest;
import com.society.society_backend.dto.MaintenanceResponse;
import com.society.society_backend.entity.MaintenanceStatus;
import com.society.society_backend.service.MaintenanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    public ResponseEntity<MaintenanceResponse> create(@RequestBody MaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.create(request));
    }

    @PostMapping("/generate")
    public BulkGenerateResult generate(@RequestBody BulkMaintenanceRequest request) {
        return maintenanceService.generateForAll(request);
    }

    @PutMapping("/{id}/pay")
    public MaintenanceResponse pay(@PathVariable Long id) {
        return maintenanceService.markPaid(id);
    }

    @GetMapping("/my")
    public List<MaintenanceResponse> myBills(Authentication authentication) {
        return maintenanceService.myBills(authentication.getName());
    }

    @GetMapping
    public List<MaintenanceResponse> all(@RequestParam(required = false) MaintenanceStatus status) {
        return maintenanceService.all(status);
    }
}