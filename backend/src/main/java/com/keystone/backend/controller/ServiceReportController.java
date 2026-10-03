package com.keystone.backend.controller;

import com.keystone.backend.entity.ServiceReport;
import com.keystone.backend.entity.ServiceRequest;
import com.keystone.backend.entity.User;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderStatus;
import com.keystone.backend.repository.ServiceReportRepository;
import com.keystone.backend.repository.ServiceRequestRepository;
import com.keystone.backend.repository.UserRepository;
import com.keystone.backend.service.WorkOrderService;

import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/service-reports")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class ServiceReportController {

    private final ServiceReportRepository serviceReportRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final WorkOrderService workOrderService;

    public ServiceReportController(
            ServiceReportRepository serviceReportRepository,
            ServiceRequestRepository serviceRequestRepository,
            UserRepository userRepository,
            WorkOrderService workOrderService) {

        this.serviceReportRepository =
                serviceReportRepository;

        this.serviceRequestRepository =
                serviceRequestRepository;

        this.userRepository =
                userRepository;

        this.workOrderService =
                workOrderService;
    }

    // =========================================================
    // GET ALL SERVICE REPORTS
    // =========================================================

    @GetMapping
    public List<ServiceReport> getAllReports() {

        return serviceReportRepository.findAll();
    }

    // =========================================================
    // GET SERVICE REPORT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ServiceReport getReportById(
            @PathVariable Long id) {

        return serviceReportRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Service report not found"));
    }

    // =========================================================
    // GET SERVICE REPORT BY WORK ORDER ID
    // =========================================================

    @GetMapping("/work-order/{workOrderId}")
    public ServiceReport getReportByWorkOrderId(
            @PathVariable Long workOrderId) {

        return serviceReportRepository
                .findByWorkOrderId(workOrderId)
                .orElse(null);
    }

    // =========================================================
    // GET SERVICE REPORT BY SERVICE REQUEST ID
    // =========================================================

    @GetMapping("/service-request/{serviceRequestId}")
    public ServiceReport getReportByServiceRequestId(
            @PathVariable Long serviceRequestId) {

        return serviceReportRepository
                .findByServiceRequestId(serviceRequestId)
                .orElse(null);
    }

    // =========================================================
    // CREATE SERVICE REPORT
    // =========================================================

    @PostMapping
        @Transactional
    public ServiceReport createReport(
            @RequestBody ServiceReport serviceReport,
            Authentication authentication) {

        // -----------------------------------------------------
        // Authentication validation
        // -----------------------------------------------------

        if (authentication == null) {
            throw new RuntimeException(
                    "Authentication is required");
        }

        // -----------------------------------------------------
        // Find logged-in user
        // -----------------------------------------------------

        String loggedInEmail =
                authentication.getName();

        User loggedInUser =
                userRepository
                        .findByEmail(loggedInEmail)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Logged-in user not found"));

        // -----------------------------------------------------
        // Only technicians can create reports
        // -----------------------------------------------------

        if (!loggedInUser.getRole()
                .name()
                .equals("TECHNICIAN")) {

            throw new RuntimeException(
                    "Only technicians can create service reports");
        }

        // -----------------------------------------------------
        // Automatically use authenticated technician
        // -----------------------------------------------------

        serviceReport.setTechnicianId(
                loggedInUser.getId());

        // =====================================================
        // SERVICE REQUEST REPORT
        // =====================================================

        if (serviceReport.getServiceRequestId() != null) {

            Long serviceRequestId =
                    serviceReport.getServiceRequestId();

            // -------------------------------------------------
            // Find service request
            // -------------------------------------------------

            ServiceRequest serviceRequest =
                    serviceRequestRepository
                            .findById(serviceRequestId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Service request not found"));

            // -------------------------------------------------
            // Verify technician assignment
            // -------------------------------------------------

            if (serviceRequest.getTechnicianId() == null
                    || !serviceRequest
                    .getTechnicianId()
                    .equals(loggedInUser.getId())) {

                throw new RuntimeException(
                        "You are not authorized to create a report for this service request");
            }

            // -------------------------------------------------
            // Prevent duplicate report
            // -------------------------------------------------

            if (serviceReportRepository
                    .existsByServiceRequestId(
                            serviceRequestId)) {

                throw new RuntimeException(
                        "Service report already exists for this service request");
            }

            // -------------------------------------------------
            // Automatically set completion time
            // -------------------------------------------------

            if (serviceReport.getCompletedAt() == null) {

                serviceReport.setCompletedAt(
                        LocalDateTime.now());
            }

            // -------------------------------------------------
            // Explicitly preserve Service Request ID
            // -------------------------------------------------

            serviceReport.setServiceRequestId(
                    serviceRequestId);
        }

        // =====================================================
        // WORK ORDER REPORT
        // =====================================================

        else if (serviceReport.getWorkOrderId() != null) {

            Long workOrderId =
                    serviceReport.getWorkOrderId();

            // -------------------------------------------------
            // Find work order
            // -------------------------------------------------

            WorkOrder workOrder =
                    workOrderService.getWorkOrderById(
                            workOrderId);

            if (workOrder == null) {

                throw new RuntimeException(
                        "Work order not found");
            }

            // -------------------------------------------------
            // Verify technician ownership
            // -------------------------------------------------

            if (workOrder.getTechnicianId() == null
                    || !workOrder
                    .getTechnicianId()
                    .equals(loggedInUser.getId())) {

                throw new RuntimeException(
                        "You are not authorized to create a report for this work order");
            }

            // -------------------------------------------------
            // Prevent duplicate report
            // -------------------------------------------------

            if (serviceReportRepository
                    .findByWorkOrderId(workOrderId)
                    .isPresent()) {

                throw new RuntimeException(
                        "Service report already exists for this work order");
            }

            // -------------------------------------------------
            // -------------------------------------------------
            // Explicitly preserve Work Order ID
            // -------------------------------------------------

            serviceReport.setWorkOrderId(
                    workOrderId);

            completeWorkOrderForReport(
                    workOrder,
                    serviceReport);
        }

        // =====================================================
        // VALIDATION
        // =====================================================

        else {

            throw new RuntimeException(
                    "Either Work Order ID or Service Request ID is required");
        }

        // =====================================================
        // SAVE REPORT
        // =====================================================

        return serviceReportRepository.save(
                serviceReport);
    }

    // =========================================================
    // UPDATE SERVICE REPORT
    // =========================================================

    @PutMapping("/{id}")
        @Transactional
    public ServiceReport updateReport(
            @PathVariable Long id,
            @RequestBody ServiceReport updatedReport,
            Authentication authentication) {

        // -----------------------------------------------------
        // Authentication validation
        // -----------------------------------------------------

        if (authentication == null) {

            throw new RuntimeException(
                    "Authentication is required");
        }

        // -----------------------------------------------------
        // Find logged-in user
        // -----------------------------------------------------

        String loggedInEmail =
                authentication.getName();

        User loggedInUser =
                userRepository
                        .findByEmail(loggedInEmail)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Logged-in user not found"));

        // -----------------------------------------------------
        // Find existing report
        // -----------------------------------------------------

        ServiceReport existingReport =
                serviceReportRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service report not found"));

        // -----------------------------------------------------
        // Technician ownership validation
        // -----------------------------------------------------

        if (loggedInUser.getRole()
                .name()
                .equals("TECHNICIAN")) {

            if (existingReport.getTechnicianId() == null
                    || !existingReport
                    .getTechnicianId()
                    .equals(loggedInUser.getId())) {

                throw new RuntimeException(
                        "You are not authorized to update this service report");
            }
        }

        // -----------------------------------------------------
        // Update editable fields
        // -----------------------------------------------------

        existingReport.setWorkPerformed(
                updatedReport.getWorkPerformed());

        existingReport.setTechnicianRemarks(
                updatedReport.getTechnicianRemarks());

        existingReport.setPartsUsed(
                updatedReport.getPartsUsed());

        existingReport.setIssuesFound(
                updatedReport.getIssuesFound());

        existingReport.setServiceDurationMinutes(
                updatedReport.getServiceDurationMinutes());

        existingReport.setCompletedAt(
                updatedReport.getCompletedAt());

        // -----------------------------------------------------
        // Preserve existing Service Request ID
        // -----------------------------------------------------

        if (existingReport.getServiceRequestId() != null) {

            existingReport.setServiceRequestId(
                    existingReport.getServiceRequestId());
        }

        // -----------------------------------------------------
        // Preserve existing Work Order ID
        // -----------------------------------------------------

        if (existingReport.getWorkOrderId() != null) {

            existingReport.setWorkOrderId(
                    existingReport.getWorkOrderId());

            WorkOrder workOrder =
                    workOrderService.getWorkOrderById(
                            existingReport.getWorkOrderId());

            completeWorkOrderForReport(
                    workOrder,
                    existingReport);
        }

        return serviceReportRepository.save(
                existingReport);
    }

        private void completeWorkOrderForReport(
                        WorkOrder workOrder,
                        ServiceReport serviceReport) {

                if (workOrder.getStatus() != WorkOrderStatus.COMPLETED
                                && workOrder.getStatus() != WorkOrderStatus.CANCELLED) {

                        workOrderService.updateWorkOrderStatus(
                                        workOrder.getId(),
                                        WorkOrderStatus.COMPLETED);
                }

                if (workOrder.getStatus() != WorkOrderStatus.CANCELLED
                                && serviceReport.getCompletedAt() == null) {

                        serviceReport.setCompletedAt(
                                        LocalDateTime.now());
                }
        }

    // =========================================================
    // DELETE SERVICE REPORT
    // =========================================================

    @DeleteMapping("/{id}")
    public String deleteReport(
            @PathVariable Long id) {

        if (!serviceReportRepository
                .existsById(id)) {

            throw new RuntimeException(
                    "Service report not found");
        }

        serviceReportRepository.deleteById(id);

        return "Service report deleted successfully";
    }
}