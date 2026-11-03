package com.society.society_backend.dto;

import com.society.society_backend.entity.Role;

import java.time.LocalDateTime;

public record PersonResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        Long flatId,
        String flatLabel,
        boolean active,
        LocalDateTime createdAt) {
}
