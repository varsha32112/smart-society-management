package com.society.society_backend.controller;

import com.society.society_backend.dto.FlatRequest;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.repository.FlatRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/flats")
public class FlatController {

    private final FlatRepository flatRepository;

    public FlatController(FlatRepository flatRepository) {
        this.flatRepository = flatRepository;
    }

    @GetMapping
    public List<Flat> getAllFlats() {
        return flatRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Flat> addFlat(@Valid @RequestBody FlatRequest request) {
        String block = request.blockName().trim().toUpperCase();
        String number = request.flatNumber().trim().toUpperCase();

        if (flatRepository.existsByBlockNameAndFlatNumber(block, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Flat " + block + "-" + number + " already exists");
        }

        Flat flat = new Flat();
        flat.setBlockName(block);
        flat.setFlatNumber(number);
        flat.setFloorNo(request.floorNo());
        return ResponseEntity.status(HttpStatus.CREATED).body(flatRepository.save(flat));
    }
}