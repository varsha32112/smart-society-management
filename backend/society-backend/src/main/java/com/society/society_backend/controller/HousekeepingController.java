package com.society.society_backend.controller;

import com.society.society_backend.dto.ComplaintStatusUpdate;
import com.society.society_backend.dto.TaskResponse;
import com.society.society_backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/housekeeping/tasks")
public class HousekeepingController {

    private final ComplaintService complaintService;

    public HousekeepingController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public List<TaskResponse> myTasks(Authentication authentication) {
        return complaintService.tasksFor(authentication.getName());
    }

    @PutMapping("/{id}/status")
    public TaskResponse update(@PathVariable Long id,
                               @Valid @RequestBody ComplaintStatusUpdate update,
                               Authentication authentication) {
        return complaintService.updateByStaff(id, authentication.getName(), update);
    }
}