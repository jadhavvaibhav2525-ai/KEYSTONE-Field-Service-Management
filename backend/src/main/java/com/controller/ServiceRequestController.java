package com.keystone.backend.controller;

import com.keystone.backend.entity.ServiceRequest;
import com.keystone.backend.entity.ServiceRequestStatus;
import com.keystone.backend.service.ServiceRequestService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(
            ServiceRequestService serviceRequestService) {

        this.serviceRequestService =
                serviceRequestService;
    }

    // =========================================
    // GET ALL SERVICE REQUESTS
    // =========================================

    @GetMapping
    public ResponseEntity<List<ServiceRequest>>
    getAllServiceRequests() {

        return ResponseEntity.ok(
                serviceRequestService
                        .getAllServiceRequests());
    }

    // =========================================
    // GET SERVICE REQUEST BY ID
    // =========================================

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest>
    getServiceRequestById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                serviceRequestService
                        .getServiceRequestById(id));
    }

    // =========================================
    // GET CUSTOMER SERVICE REQUESTS
    // =========================================

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<ServiceRequest>>
    getCustomerServiceRequests(
            @PathVariable Long customerId) {

        return ResponseEntity.ok(
                serviceRequestService
                        .getServiceRequestsByCustomer(
                                customerId));
    }

    // =========================================
    // GET SERVICE REQUESTS BY STATUS
    // =========================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ServiceRequest>>
    getServiceRequestsByStatus(
            @PathVariable ServiceRequestStatus status) {

        return ResponseEntity.ok(
                serviceRequestService
                        .getServiceRequestsByStatus(
                                status));
    }

    // =========================================
    // CREATE SERVICE REQUEST
    // =========================================

    @PostMapping
    public ResponseEntity<ServiceRequest>
    createServiceRequest(
            @RequestBody ServiceRequest serviceRequest,
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(401)
                    .build();
        }

        ServiceRequest savedRequest =
                serviceRequestService
                        .createServiceRequest(
                                serviceRequest);

        return ResponseEntity.ok(savedRequest);
    }

    // =========================================
    // UPDATE SERVICE REQUEST
    // =========================================

    @PutMapping("/{id}")
    public ResponseEntity<ServiceRequest>
    updateServiceRequest(
            @PathVariable Long id,
            @RequestBody ServiceRequest updatedRequest) {

        ServiceRequest savedRequest =
                serviceRequestService
                        .updateServiceRequest(
                                id,
                                updatedRequest);

        return ResponseEntity.ok(savedRequest);
    }

    // =========================================
    // UPDATE SERVICE REQUEST STATUS
    // =========================================

    @PutMapping("/{id}/status")
    public ResponseEntity<ServiceRequest>
    updateServiceRequestStatus(
            @PathVariable Long id,
            @RequestParam ServiceRequestStatus status) {

        ServiceRequest updatedRequest =
                serviceRequestService
                        .updateServiceRequestStatus(
                                id,
                                status);

        return ResponseEntity.ok(updatedRequest);
    }

    // =========================================
    // DELETE SERVICE REQUEST
    // =========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String>
    deleteServiceRequest(
            @PathVariable Long id) {

        serviceRequestService
                .deleteServiceRequest(id);

        return ResponseEntity.ok(
                "Service request deleted successfully");
    }
    @PutMapping("/{id}/assign")
public ResponseEntity<ServiceRequest> assignTechnician(
        @PathVariable Long id,
        @RequestBody Map<String, Object> requestData) {

    ServiceRequest serviceRequest = serviceRequestService
            .getServiceRequestById(id);

    if (serviceRequest == null) {
        return ResponseEntity.notFound().build();
    }

    Object technicianIdObject = requestData.get("technicianId");
    Object technicianNameObject = requestData.get("technicianName");

    if (technicianIdObject == null || technicianNameObject == null) {
        return ResponseEntity.badRequest().build();
    }

    Long technicianId;

    try {
        technicianId = Long.valueOf(
                technicianIdObject.toString()
        );
    } catch (NumberFormatException e) {
        return ResponseEntity.badRequest().build();
    }

    String technicianName = technicianNameObject.toString();

    serviceRequest.setTechnicianId(technicianId);
    serviceRequest.setTechnicianName(technicianName);
    serviceRequest.setAssignedAt(LocalDateTime.now());
    serviceRequest.setStatus(ServiceRequestStatus.ASSIGNED);

    ServiceRequest updatedRequest =
            serviceRequestService.updateServiceRequest(
                    id,
                    serviceRequest
            );

    return ResponseEntity.ok(updatedRequest);
}
// =========================================
// GET SERVICE REQUESTS BY TECHNICIAN
// =========================================

@GetMapping("/technician/{technicianId}")
public ResponseEntity<List<ServiceRequest>>
getTechnicianServiceRequests(
        @PathVariable Long technicianId) {

    return ResponseEntity.ok(
            serviceRequestService
                    .getServiceRequestsByTechnician(
                            technicianId));
}
}