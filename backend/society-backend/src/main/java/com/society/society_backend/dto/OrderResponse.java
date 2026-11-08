package com.society.society_backend.dto;

public record OrderResponse(String orderId, long amount, String currency, String keyId, String description) {
}