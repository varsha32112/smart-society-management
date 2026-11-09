package com.society.society_backend.controller;

import com.society.society_backend.dto.ClaimRejection;
import com.society.society_backend.dto.UpiClaimResponse;
import com.society.society_backend.entity.UpiClaimStatus;
import com.society.society_backend.service.UpiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/upi-claims")
public class AdminUpiController {

    private final UpiService upiService;

    public AdminUpiController(UpiService upiService) {
        this.upiService = upiService;
    }

    @GetMapping
    public List<UpiClaimResponse> list(@RequestParam(required = false) UpiClaimStatus status) {
        return upiService.list(status);
    }

    @PutMapping("/{id}/confirm")
    public UpiClaimResponse confirm(@PathVariable Long id) {
        return upiService.confirm(id);
    }

    @PutMapping("/{id}/reject")
    public UpiClaimResponse reject(@PathVariable Long id, @Valid @RequestBody ClaimRejection rejection) {
        return upiService.reject(id, rejection.note());
    }
}
