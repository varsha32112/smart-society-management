package com.society.society_backend.controller;

import com.society.society_backend.dto.UpiClaimRequest;
import com.society.society_backend.dto.UpiClaimResponse;
import com.society.society_backend.dto.UpiConfig;
import com.society.society_backend.service.UpiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/upi")
public class UpiController {

    private final UpiService upiService;

    public UpiController(UpiService upiService) {
        this.upiService = upiService;
    }

    @GetMapping("/config")
    public UpiConfig config() {
        return upiService.config();
    }

    @PostMapping("/claims")
    public ResponseEntity<UpiClaimResponse> submit(@Valid @RequestBody UpiClaimRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(upiService.submitClaim(request, authentication.getName()));
    }

    @GetMapping("/claims/my")
    public List<UpiClaimResponse> myClaims(Authentication authentication) {
        return upiService.myClaims(authentication.getName());
    }
}
