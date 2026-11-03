package com.society.society_backend.service;

import com.society.society_backend.dto.FlatRequest;
import com.society.society_backend.entity.Flat;
import com.society.society_backend.repository.FlatRepository;
import com.society.society_backend.repository.MaintenanceRepository;
import com.society.society_backend.repository.UserRepository;
import com.society.society_backend.repository.VisitorRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FlatService {

    private final FlatRepository flatRepository;
    private final UserRepository userRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final VisitorRepository visitorRepository;

    public FlatService(FlatRepository flatRepository,
                       UserRepository userRepository,
                       MaintenanceRepository maintenanceRepository,
                       VisitorRepository visitorRepository) {
        this.flatRepository = flatRepository;
        this.userRepository = userRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.visitorRepository = visitorRepository;
    }

    public List<Flat> list() {
        return flatRepository.findAll(Sort.by("blockName", "flatNumber"));
    }

    @Transactional
    public Flat add(FlatRequest request) {
        String block = normalize(request.blockName());
        String number = normalize(request.flatNumber());

        if (flatRepository.existsByBlockNameAndFlatNumber(block, number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Flat " + block + "-" + number + " already exists");
        }

        Flat flat = new Flat();
        flat.setBlockName(block);
        flat.setFlatNumber(number);
        flat.setFloorNo(request.floorNo());
        return flatRepository.save(flat);
    }

    @Transactional
    public Flat update(Long id, FlatRequest request) {
        Flat flat = find(id);
        String block = normalize(request.blockName());
        String number = normalize(request.flatNumber());

        if (flatRepository.existsByBlockNameAndFlatNumberAndIdNot(block, number, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Flat " + block + "-" + number + " already exists");
        }

        flat.setBlockName(block);
        flat.setFlatNumber(number);
        flat.setFloorNo(request.floorNo());
        return flatRepository.save(flat);
    }

    @Transactional
    public void delete(Long id) {
        Flat flat = find(id);

        if (userRepository.existsByFlatId(id)
                || maintenanceRepository.existsByFlatId(id)
                || visitorRepository.existsByFlatId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Flat " + flat.getBlockName() + "-" + flat.getFlatNumber()
                            + " has residents, bills or visitors and cannot be deleted");
        }
        flatRepository.delete(flat);
    }

    private Flat find(Long id) {
        return flatRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flat not found"));
    }

    private String normalize(String value) {
        return value.trim().toUpperCase();
    }
}