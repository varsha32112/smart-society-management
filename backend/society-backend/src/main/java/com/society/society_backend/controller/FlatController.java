package com.society.society_backend.controller;

import com.society.society_backend.dto.FlatRequest;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.service.FlatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flats")
public class FlatController {

    private final FlatService flatService;

    public FlatController(FlatService flatService) {
        this.flatService = flatService;
    }

    @GetMapping
    public List<Flat> list() {
        return flatService.list();
    }

    @PostMapping
    public ResponseEntity<Flat> add(@Valid @RequestBody FlatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flatService.add(request));
    }

    @PutMapping("/{id}")
    public Flat update(@PathVariable Long id, @Valid @RequestBody FlatRequest request) {
        return flatService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flatService.delete(id);
        return ResponseEntity.noContent().build();
    }
}