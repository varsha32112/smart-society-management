package com.society.society_backend.controller;
import com.society.society_backend.dto.ResidentSearchResult;
import com.society.society_backend.entity.Role;
import com.society.society_backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {
    private final UserRepository userRepository;

    public ResidentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public List<ResidentSearchResult> search(@RequestParam(defaultValue = "") String name) {
        return userRepository.findByRoleAndFullNameContainingIgnoreCase(Role.RESIDENT, name).stream()
                .filter(u -> u.getFlat() != null)
                .map(u -> new ResidentSearchResult(
                        u.getId(),
                        u.getFullName(),
                        u.getFlat().getId(),
                        u.getFlat().getBlockName() + "-" + u.getFlat().getFlatNumber()))
                .toList();
    }
}
