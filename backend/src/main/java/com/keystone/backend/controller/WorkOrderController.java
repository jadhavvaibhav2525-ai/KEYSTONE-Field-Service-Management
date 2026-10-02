package com.keystone.backend.controller;

import com.keystone.backend.entity.User;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderStatus;
import com.keystone.backend.repository.UserRepository;
import com.keystone.backend.service.WorkOrderService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-orders")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final UserRepository userRepository;

    public WorkOrderController(
            WorkOrderService workOrderService,
            UserRepository userRepository) {

        this.workOrderService = workOrderService;
        this.userRepository = userRepository;
    }

    // GET - Get all work orders (staff access controlled by SecurityConfig)
    @GetMapping
    public List<WorkOrder> getAllWorkOrders() {

        return workOrderService.getAllWorkOrders();
    }

    // GET - Get work orders belonging to the logged-in customer
    @GetMapping("/customer/me")
    public List<WorkOrder> getMyWorkOrders(
            Authentication authentication) {

        if (authentication == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        User loggedInUser = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Logged-in user not found"
                ));

        if (!loggedInUser.getRole().name().equals("CUSTOMER")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only customers can access this endpoint"
            );
        }

        return workOrderService.getWorkOrdersByCustomer(
                loggedInUser.getId()
        );
    }

    // GET - Get work order by ID
    @GetMapping("/{id}")
    public WorkOrder getWorkOrderById(
            @PathVariable Long id) {

        return workOrderService.getWorkOrderById(id);
    }

    // GET - Get work orders assigned to a technician
    @GetMapping("/technician/{technicianId}")
    public List<WorkOrder> getTechnicianWorkOrders(
            @PathVariable Long technicianId) {

        return workOrderService.getWorkOrdersByTechnician(
                technicianId
        );
    }

    // POST - Create work order
    @PostMapping
    public WorkOrder createWorkOrder(
            @RequestBody WorkOrder workOrder) {

        return workOrderService.createWorkOrder(workOrder);
    }

    // PUT - Update complete work order
    @PutMapping("/{id}")
    public WorkOrder updateWorkOrder(
            @PathVariable Long id,
            @RequestBody WorkOrder workOrder) {

        return workOrderService.updateWorkOrder(
                id,
                workOrder
        );
    }

    // PUT - Update work order status
    // Technician ownership validation is performed here
    @PutMapping("/{id}/status")
    public WorkOrder updateWorkOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String statusValue = request.get("status");

        if (statusValue == null ||
                statusValue.trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required"
            );
        }

        WorkOrder workOrder =
                workOrderService.getWorkOrderById(id);

        String loggedInEmail = authentication.getName();

        User loggedInUser = userRepository
                .findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Logged-in user not found"
                ));

        if (loggedInUser.getRole().name().equals("TECHNICIAN")) {

            if (workOrder.getTechnicianId() == null ||
                    !workOrder.getTechnicianId()
                            .equals(loggedInUser.getId())) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not authorized to update this work order"
                );
            }
        }

        WorkOrderStatus status;

        try {
            status = WorkOrderStatus.valueOf(
                    statusValue.toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid work order status: " + statusValue
            );
        }

        return workOrderService.updateWorkOrderStatus(
                id,
                status
        );
    }

    // DELETE - Delete work order
    @DeleteMapping("/{id}")
    public String deleteWorkOrder(
            @PathVariable Long id) {

        workOrderService.deleteWorkOrder(id);

        return "Work order deleted successfully";
    }
}