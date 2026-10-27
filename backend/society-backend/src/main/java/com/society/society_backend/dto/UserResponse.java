package com.society.society_backend.dto;

import com.society.society_backend.entity.Role;

public record UserResponse(Long id,
                           String fullName,
                           String email,
                           Role role,
                           Long flatId) {
}