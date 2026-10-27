package com.society.society_backend.dto;
import com.society.society_backend.entity.Role;

public record RegisterRequest(String fullName,
                              String email,
                              String phone,
                              String password,
                              Role role,
                              Long flatId) {
}