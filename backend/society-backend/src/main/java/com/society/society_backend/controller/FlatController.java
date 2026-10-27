package com.society.society_backend.controller;

import com.society.society_backend.entity.Flat;
import com.society.society_backend.repository.FlatRepository;
import org.springframework.web.bind.annotation.*;

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
    public Flat addFlat(@RequestBody Flat flat) {
        return flatRepository.save(flat);
    }
}
