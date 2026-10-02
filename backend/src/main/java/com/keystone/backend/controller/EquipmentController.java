package com.keystone.backend.controller;

import com.keystone.backend.entity.Equipment;
import com.keystone.backend.entity.Facility;
import com.keystone.backend.entity.User;
import com.keystone.backend.repository.EquipmentRepository;
import com.keystone.backend.repository.FacilityRepository;
import com.keystone.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;

    public EquipmentController(
            EquipmentRepository equipmentRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository) {

        this.equipmentRepository = equipmentRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    @GetMapping("/facility/{facilityId}")
    public List<Equipment> getEquipmentByFacility(
            @PathVariable Long facilityId,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        User loggedInUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Logged-in user not found"
                ));

        String role = loggedInUser.getRole().name();

        if ("CUSTOMER".equals(role)) {

            boolean facilityBelongsToCustomer =
                    facilityRepository.findByCustomerId(loggedInUser.getId())
                            .stream()
                            .anyMatch(facility ->
                                    facility.getId().equals(facilityId)
                            );

            if (!facilityBelongsToCustomer) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not authorized to access this facility"
                );
            }

        } else if (!List.of("ADMIN", "DISPATCHER", "MANAGER").contains(role)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access equipment"
            );
        }

        return equipmentRepository.findByFacilityId(facilityId);
    }

    @PostMapping
    public Equipment createEquipment(
            @RequestParam String name,
            @RequestParam String equipmentCode,
            @RequestParam String type,
            @RequestParam String model,
            @RequestParam String status,
            @RequestParam Long facilityId) {

        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Facility not found"
                ));

        Equipment equipment = new Equipment();
        equipment.setName(name);
        equipment.setEquipmentCode(equipmentCode);
        equipment.setType(type);
        equipment.setModel(model);
        equipment.setStatus(status);
        equipment.setFacility(facility);

        return equipmentRepository.save(equipment);
    }

    @DeleteMapping("/{id}")
    public String deleteEquipment(@PathVariable Long id) {

        if (!equipmentRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Equipment not found"
            );
        }

        equipmentRepository.deleteById(id);

        return "Equipment deleted successfully";
    }
}