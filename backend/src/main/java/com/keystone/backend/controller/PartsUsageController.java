package com.keystone.backend.controller;

import com.keystone.backend.entity.PartsUsage;
import com.keystone.backend.service.PartsUsageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts-usage")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class PartsUsageController {

    private final PartsUsageService partsUsageService;

    public PartsUsageController(
            PartsUsageService partsUsageService) {
        this.partsUsageService = partsUsageService;
    }

    // GET all parts usage
    @GetMapping
    public ResponseEntity<List<PartsUsage>> getAllPartsUsage() {
        return ResponseEntity.ok(
                partsUsageService.getAllPartsUsage()
        );
    }

    // GET parts usage by ID
    @GetMapping("/{id}")
    public ResponseEntity<PartsUsage> getPartsUsageById(
            @PathVariable Long id) {

        return partsUsageService
                .getPartsUsageById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // GET parts used for a Work Order
    @GetMapping("/work-order/{workOrderId}")
    public ResponseEntity<List<PartsUsage>> getPartsByWorkOrder(
            @PathVariable Long workOrderId) {

        return ResponseEntity.ok(
                partsUsageService.getPartsByWorkOrder(
                        workOrderId
                )
        );
    }

    // GET parts used for a Service Request
    @GetMapping("/service-request/{serviceRequestId}")
    public ResponseEntity<List<PartsUsage>> getPartsByServiceRequest(
            @PathVariable Long serviceRequestId) {

        return ResponseEntity.ok(
                partsUsageService.getPartsByServiceRequest(
                        serviceRequestId
                )
        );
    }

    // GET parts used by a Technician
    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<PartsUsage>> getPartsByTechnician(
            @PathVariable Long technicianId) {

        return ResponseEntity.ok(
                partsUsageService.getPartsByTechnician(
                        technicianId
                )
        );
    }

    // CREATE parts usage
    @PostMapping
    public ResponseEntity<PartsUsage> createPartsUsage(
            @RequestBody PartsUsage partsUsage) {

        PartsUsage savedPartsUsage =
                partsUsageService.createPartsUsage(partsUsage);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedPartsUsage);
    }

    // UPDATE parts usage
    @PutMapping("/{id}")
    public ResponseEntity<PartsUsage> updatePartsUsage(
            @PathVariable Long id,
            @RequestBody PartsUsage partsUsage) {

        return partsUsageService
                .updatePartsUsage(id, partsUsage)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // DELETE parts usage
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePartsUsage(
            @PathVariable Long id) {

        boolean deleted =
                partsUsageService.deletePartsUsage(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}