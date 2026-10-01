package com.keystone.backend.service;

import com.keystone.backend.entity.Facility;
import com.keystone.backend.entity.ServiceRequest;
import com.keystone.backend.entity.ServiceRequestPriority;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderPriority;
import com.keystone.backend.entity.WorkOrderStatus;
import com.keystone.backend.repository.FacilityRepository;
import com.keystone.backend.repository.WorkOrderRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final NotificationService notificationService;
    private final FacilityRepository facilityRepository;

    public WorkOrderService(
            WorkOrderRepository workOrderRepository,
            NotificationService notificationService,
            FacilityRepository facilityRepository) {

        this.workOrderRepository = workOrderRepository;
        this.notificationService = notificationService;
        this.facilityRepository = facilityRepository;
    }

    // GET - Get all work orders
    public List<WorkOrder> getAllWorkOrders() {

        return workOrderRepository.findAll();
    }

    // GET - Get work order by ID
    public WorkOrder getWorkOrderById(Long id) {

        return workOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Work order not found")
                );
    }

    // GET - Get work orders assigned to a technician
    public List<WorkOrder> getWorkOrdersByTechnician(
            Long technicianId) {

        return workOrderRepository
                .findByTechnicianId(technicianId);
    }

    // GET - Get work orders belonging to a customer
    public List<WorkOrder> getWorkOrdersByCustomer(
            Long customerId) {

        return workOrderRepository
                .findByCustomerId(customerId);
    }

    // POST - Create work order
    public WorkOrder createWorkOrder(WorkOrder workOrder) {

        WorkOrder savedWorkOrder =
                workOrderRepository.save(workOrder);

        // Notify all DISPATCHER users
        try {

            notificationService.notifyUsersByRole(
                    "DISPATCHER",
                    "New Work Order Created",
                    "A new work order #" +
                            savedWorkOrder.getId() +
                            " has been created by " +
                            savedWorkOrder.getCustomerName(),
                    "WORK_ORDER_CREATED",
                    savedWorkOrder.getId()
            );

        } catch (Exception e) {

            System.out.println(
                    "Dispatcher notification failed: "
                            + e.getMessage()
            );
        }

        // Notify all MANAGER users
        try {

            notificationService.notifyUsersByRole(
                    "MANAGER",
                    "New Work Order Created",
                    "A new work order #" +
                            savedWorkOrder.getId() +
                            " requires attention.",
                    "WORK_ORDER_CREATED",
                    savedWorkOrder.getId()
            );

        } catch (Exception e) {

            System.out.println(
                    "Manager notification failed: "
                            + e.getMessage()
            );
        }

        return savedWorkOrder;
    }

    // CREATE WORK ORDER FROM SERVICE REQUEST
    public WorkOrder createFromServiceRequest(
            ServiceRequest serviceRequest) {

        /*
         * Prevent duplicate work orders.
         *
         * If this service request has already created
         * a work order, return the existing work order.
         */
        return workOrderRepository
                .findByServiceRequestId(
                        serviceRequest.getId()
                )
                .orElseGet(() -> {

                    WorkOrder workOrder =
                            new WorkOrder();

                    // Link Work Order to Service Request
                    workOrder.setServiceRequestId(
                            serviceRequest.getId()
                    );

                    // Basic information
                    workOrder.setTitle(
                            "Service Request #" +
                                    serviceRequest.getId()
                    );

                    workOrder.setDescription(
                            serviceRequest
                                    .getProblemDescription()
                    );

                    // Customer information
                    workOrder.setCustomerName(
                            serviceRequest.getCustomerName()
                    );

                    workOrder.setCustomerEmail(
                            serviceRequest.getCustomerEmail()
                    );

                    workOrder.setCustomerId(
                            serviceRequest.getCustomerId()
                    );

                    // Facility
                    workOrder.setFacilityId(
                            serviceRequest.getFacilityId()
                    );

                    /*
                     * Get facility address and use it
                     * as the Work Order location.
                     */
                    if (serviceRequest.getFacilityId() != null) {

                        facilityRepository
                                .findById(
                                        serviceRequest.getFacilityId()
                                )
                                .ifPresent(facility -> {

                                    workOrder.setLocation(
                                            facility.getAddress()
                                    );
                                });
                    }

                    // Equipment
                    workOrder.setEquipmentId(
                            serviceRequest.getEquipmentId()
                    );

                    // Convert priority
                    workOrder.setPriority(
                            convertPriority(
                                    serviceRequest.getPriority()
                            )
                    );

                    // New work order starts as PENDING
                    workOrder.setStatus(
                            WorkOrderStatus.PENDING
                    );

                    /*
                     * If the service request already has
                     * a technician, copy the technician.
                     */
                    if (serviceRequest
                            .getTechnicianId() != null) {

                        workOrder.setTechnicianId(
                                serviceRequest
                                        .getTechnicianId()
                        );
                    }

                    /*
                     * Save using the existing createWorkOrder()
                     * method so notifications continue to work.
                     */
                    return createWorkOrder(workOrder);
                });
    }

    // Convert Service Request Priority to Work Order Priority
    private WorkOrderPriority convertPriority(
            ServiceRequestPriority priority) {

        if (priority == null) {

            return WorkOrderPriority.MEDIUM;
        }

        switch (priority) {

            case LOW:
                return WorkOrderPriority.LOW;

            case MEDIUM:
                return WorkOrderPriority.MEDIUM;

            case HIGH:
                return WorkOrderPriority.HIGH;

            case CRITICAL:
                return WorkOrderPriority.URGENT;

            default:
                return WorkOrderPriority.MEDIUM;
        }
    }

    // PUT - Update complete work order
    public WorkOrder updateWorkOrder(
            Long id,
            WorkOrder updatedWorkOrder) {

        WorkOrder existingWorkOrder =
                workOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Work order not found"
                                )
                        );

        existingWorkOrder.setTitle(
                updatedWorkOrder.getTitle()
        );

        existingWorkOrder.setDescription(
                updatedWorkOrder.getDescription()
        );

        existingWorkOrder.setCustomerName(
                updatedWorkOrder.getCustomerName()
        );

        existingWorkOrder.setCustomerEmail(
                updatedWorkOrder.getCustomerEmail()
        );

        existingWorkOrder.setCustomerPhone(
                updatedWorkOrder.getCustomerPhone()
        );

        existingWorkOrder.setLocation(
                updatedWorkOrder.getLocation()
        );

        existingWorkOrder.setCustomerId(
                updatedWorkOrder.getCustomerId()
        );

        existingWorkOrder.setFacilityId(
                updatedWorkOrder.getFacilityId()
        );

        existingWorkOrder.setEquipmentId(
                updatedWorkOrder.getEquipmentId()
        );

        /*
         * Preserve Service Request relationship
         * unless a new value is explicitly supplied.
         */
        if (updatedWorkOrder.getServiceRequestId()
                != null) {

            existingWorkOrder.setServiceRequestId(
                    updatedWorkOrder.getServiceRequestId()
            );
        }

        existingWorkOrder.setStatus(
                updatedWorkOrder.getStatus()
        );

        existingWorkOrder.setPriority(
                updatedWorkOrder.getPriority()
        );

        existingWorkOrder.setTechnicianId(
                updatedWorkOrder.getTechnicianId()
        );

        existingWorkOrder.setScheduledDate(
                updatedWorkOrder.getScheduledDate()
        );

        return workOrderRepository.save(
                existingWorkOrder
        );
    }

    // PUT - Update only work order status
    public WorkOrder updateWorkOrderStatus(
            Long id,
            WorkOrderStatus status) {

        WorkOrder workOrder =
                workOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Work order not found"
                                )
                        );

        workOrder.setStatus(status);

        return workOrderRepository.save(
                workOrder
        );
    }

    // DELETE - Delete work order
    public void deleteWorkOrder(Long id) {

        if (!workOrderRepository.existsById(id)) {

            throw new RuntimeException(
                    "Work order not found"
            );
        }

        workOrderRepository.deleteById(id);
    }
}