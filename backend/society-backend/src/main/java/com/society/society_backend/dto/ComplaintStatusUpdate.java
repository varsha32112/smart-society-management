package com.society.society_backend.dto;

import com.society.society_backend.entity.ComplaintStatus;

public record ComplaintStatusUpdate(ComplaintStatus status, String adminRemarks) {
}
