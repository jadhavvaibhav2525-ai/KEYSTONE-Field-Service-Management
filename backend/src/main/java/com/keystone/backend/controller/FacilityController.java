package com.keystone.backend.controller;

import com.keystone.backend.entity.Facility;
import com.keystone.backend.entity.User;
import com.keystone.backend.repository.FacilityRepository;
import com.keystone.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class FacilityController {

    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;

    public FacilityController(
            FacilityRepository facilityRepository,
            UserRepository userRepository) {
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    // Secure endpoint: return facilities belonging to the logged-in customer
    @GetMapping("/customer/me")
    public List<Facility> getMyFacilities(Authentication authentication) {

        User loggedInUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Logged-in user not found"));

        if (!loggedInUser.getRole().name().equals("CUSTOMER")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only customers can access this endpoint");
        }

        return facilityRepository.findByCustomerId(loggedInUser.getId());
    }

    @GetMapping("/customer/{customerId}")
    public List<Facility> getFacilitiesByCustomer(
            @PathVariable Long customerId) {

        return facilityRepository.findByCustomerId(customerId);
    }

    @PostMapping
    public Facility createFacility(
            @RequestParam String name,
            @RequestParam String address,
            @RequestParam Long customerId) {

        User customer = userRepository.findById(customerId)
                .orElseThrow(() ->
                        new RuntimeException("Customer not found"));

        Facility facility = new Facility();
        facility.setName(name);
        facility.setAddress(address);
        facility.setCustomer(customer);

        return facilityRepository.save(facility);
    }

    @DeleteMapping("/{id}")
    public String deleteFacility(@PathVariable Long id) {

        if (!facilityRepository.existsById(id)) {
            throw new RuntimeException("Facility not found");
        }

        facilityRepository.deleteById(id);

        return "Facility deleted successfully";
    }
}