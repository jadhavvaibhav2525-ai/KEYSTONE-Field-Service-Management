package com.keystone.backend.controller;

import com.keystone.backend.entity.TimeTracking;
import com.keystone.backend.service.TimeTrackingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/time-tracking")
@CrossOrigin(origins = "http://localhost:5173")
public class TimeTrackingController {

    private final TimeTrackingService timeTrackingService;

    public TimeTrackingController(
            TimeTrackingService timeTrackingService) {

        this.timeTrackingService = timeTrackingService;
    }

    @GetMapping
    public ResponseEntity<List<TimeTracking>> getAllTimeTracking() {

        return ResponseEntity.ok(
                timeTrackingService.getAllTimeTracking()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimeTracking> getTimeTrackingById(
            @PathVariable Long id) {

        return timeTrackingService
                .getTimeTrackingById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @GetMapping("/work-order/{workOrderId}")
    public ResponseEntity<List<TimeTracking>> getTimeByWorkOrder(
            @PathVariable Long workOrderId) {

        return ResponseEntity.ok(
                timeTrackingService.getTimeByWorkOrder(
                        workOrderId
                )
        );
    }

    @GetMapping("/service-request/{serviceRequestId}")
    public ResponseEntity<List<TimeTracking>> getTimeByServiceRequest(
            @PathVariable Long serviceRequestId) {

        return ResponseEntity.ok(
                timeTrackingService.getTimeByServiceRequest(
                        serviceRequestId
                )
        );
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<TimeTracking>> getTimeByTechnician(
            @PathVariable Long technicianId) {

        return ResponseEntity.ok(
                timeTrackingService.getTimeByTechnician(
                        technicianId
                )
        );
    }

    @PostMapping
    public ResponseEntity<TimeTracking> createTimeTracking(
            @RequestBody TimeTracking timeTracking) {

        TimeTracking savedTimeTracking =
                timeTrackingService.createTimeTracking(
                        timeTracking
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTimeTracking);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimeTracking> updateTimeTracking(
            @PathVariable Long id,
            @RequestBody TimeTracking timeTracking) {

        return timeTrackingService
                .updateTimeTracking(id, timeTracking)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimeTracking(
            @PathVariable Long id) {

        boolean deleted =
                timeTrackingService.deleteTimeTracking(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}