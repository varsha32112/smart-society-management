package com.society.society_backend.controller;
import com.society.society_backend.dto.VisitorRequest;
import com.society.society_backend.dto.VisitorResponse;
import com.society.society_backend.entity.VisitorStatus;
import com.society.society_backend.service.VisitorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {
    private final VisitorService visitorService;

    public VisitorController(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    @PostMapping
    public ResponseEntity<VisitorResponse> register(@RequestBody VisitorRequest request,
                                                    Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(visitorService.register(request, authentication.getName()));
    }

    @GetMapping("/my")
    public List<VisitorResponse> myVisitors(@RequestParam(required = false) VisitorStatus status,
                                            Authentication authentication) {
        return visitorService.myVisitors(authentication.getName(), status);
    }

    @PutMapping("/{id}/approve")
    public VisitorResponse approve(@PathVariable Long id, Authentication authentication) {
        return visitorService.decide(id, authentication.getName(), true);
    }

    @PutMapping("/{id}/reject")
    public VisitorResponse reject(@PathVariable Long id, Authentication authentication) {
        return visitorService.decide(id, authentication.getName(), false);
    }

    @PutMapping("/{id}/entry")
    public VisitorResponse entry(@PathVariable Long id) {
        return visitorService.recordEntry(id);
    }

    @PutMapping("/{id}/exit")
    public VisitorResponse exit(@PathVariable Long id) {
        return visitorService.recordExit(id);
    }

    @GetMapping("/{id}")
    public VisitorResponse getOne(@PathVariable Long id) {
        return visitorService.getById(id);
    }

    @GetMapping
    public List<VisitorResponse> getAll() {
        return visitorService.getAll();
    }
}
