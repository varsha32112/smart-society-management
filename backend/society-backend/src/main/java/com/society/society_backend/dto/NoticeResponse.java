package com.society.society_backend.dto;

import java.time.LocalDateTime;

public record NoticeResponse(Long id, String title, String content, String postedBy, LocalDateTime createdAt) {
}
