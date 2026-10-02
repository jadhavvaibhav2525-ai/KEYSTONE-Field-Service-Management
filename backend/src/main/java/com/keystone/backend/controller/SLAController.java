package com.keystone.backend.controller;

import com.keystone.backend.entity.SLA;
import com.keystone.backend.service.SLAService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sla")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class SLAController {

    private final SLAService slaService;

    public SLAController(SLAService slaService) {
        this.slaService = slaService;
    }

    // GET: Retrieve all SLA records
    @GetMapping
    public ResponseEntity<List<SLA>> getAllSLAs() {
        return ResponseEntity.ok(slaService.getAllSLAs());
    }

    // GET: Retrieve SLA by ID
    @GetMapping("/{id}")
    public ResponseEntity<SLA> getSLAById(@PathVariable Long id) {

        Optional<SLA> sla = slaService.getSLAById(id);

        return sla.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET: Retrieve SLA by Service Request ID
    @GetMapping("/service-request/{serviceRequestId}")
    public ResponseEntity<SLA> getSLAByServiceRequestId(
            @PathVariable Long serviceRequestId
    ) {

        Optional<SLA> sla =
                slaService.getSLAByServiceRequestId(serviceRequestId);

        return sla.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST: Create SLA
    @PostMapping
    public ResponseEntity<?> createSLA(@RequestBody SLA sla) {

        try {
            SLA createdSLA = slaService.createSLA(sla);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(createdSLA);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }

    // PUT: Update SLA
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSLA(
            @PathVariable Long id,
            @RequestBody SLA updatedSLA
    ) {

        try {
            Optional<SLA> sla = slaService.updateSLA(id, updatedSLA);

            return sla.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }

    // POST: Record technician response time
    @PostMapping("/{id}/response")
    public ResponseEntity<SLA> recordResponse(@PathVariable Long id) {

        Optional<SLA> sla = slaService.recordResponse(id);

        return sla.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST: Record service request resolution time
    @PostMapping("/{id}/resolution")
    public ResponseEntity<SLA> recordResolution(@PathVariable Long id) {

        Optional<SLA> sla = slaService.recordResolution(id);

        return sla.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE: Delete SLA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSLA(@PathVariable Long id) {

        boolean deleted = slaService.deleteSLA(id);

        if (deleted) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }
}