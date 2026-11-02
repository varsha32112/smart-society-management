package com.society.society_backend.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Our own deliberate errors, such as "Visitor is not approved"
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "The request could not be completed";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }

    // Rules from the annotations, such as @NotBlank and @Size
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .sorted()
                .findFirst()
                .orElse("The request contains invalid data");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    // Broken JSON, a wrong date format, an unknown status word
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "The request is incomplete or has an invalid format"));
    }

    // A wrong value in the address, such as ?status=FOO
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid value for '" + ex.getName() + "'"));
    }

    // Last line of defence from the database, such as text that is too long
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(409).body(Map.of("message", "This data conflicts with existing records or is too long"));
    }
}