package com.keystone.backend.service;

import com.keystone.backend.entity.ServiceRequest;
import com.keystone.backend.entity.ServiceRequestStatus;
import com.keystone.backend.repository.ServiceRequestRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;

    private final WorkOrderService workOrderService;

    public ServiceRequestService(
            ServiceRequestRepository serviceRequestRepository,
            WorkOrderService workOrderService) {

        this.serviceRequestRepository =
                serviceRequestRepository;

        this.workOrderService =
                workOrderService;
    }

    // Get all service requests
    public List<ServiceRequest> getAllServiceRequests() {

        return serviceRequestRepository.findAll();
    }

    // Get service request by ID
    public ServiceRequest getServiceRequestById(
            Long id) {

        return serviceRequestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Service request not found"
                        )
                );
    }

    // Get service requests of a customer
    public List<ServiceRequest> getServiceRequestsByCustomer(
            Long customerId) {

        return serviceRequestRepository
                .findByCustomerId(customerId);
    }

    // Get service requests assigned to a technician
    public List<ServiceRequest> getServiceRequestsByTechnician(
            Long technicianId) {

        return serviceRequestRepository
                .findByTechnicianId(technicianId);
    }

    // Get service requests by status
    public List<ServiceRequest> getServiceRequestsByStatus(
            ServiceRequestStatus status) {

        return serviceRequestRepository
                .findByStatus(status);
    }

    // Create service request
    public ServiceRequest createServiceRequest(
            ServiceRequest serviceRequest) {

        // Set default status
        if (serviceRequest.getStatus() == null) {

            serviceRequest.setStatus(
                    ServiceRequestStatus.NEW
            );
        }

        // Set default priority
        if (serviceRequest.getPriority() == null) {

            serviceRequest.setPriority(
                    com.keystone.backend.entity
                            .ServiceRequestPriority.MEDIUM
            );
        }

        /*
         * First save the Service Request.
         */
        ServiceRequest savedRequest =
                serviceRequestRepository.save(
                        serviceRequest
                );

        /*
         * Automatically create a Work Order
         * from the new Service Request.
         */
        workOrderService.createFromServiceRequest(
                savedRequest
        );

        return savedRequest;
    }

    // Update service request
    public ServiceRequest updateServiceRequest(
            Long id,
            ServiceRequest updatedRequest) {

        ServiceRequest existingRequest =
                serviceRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service request not found"
                                )
                        );

        existingRequest.setCustomerId(
                updatedRequest.getCustomerId()
        );

        existingRequest.setCustomerName(
                updatedRequest.getCustomerName()
        );

        existingRequest.setCustomerEmail(
                updatedRequest.getCustomerEmail()
        );

        existingRequest.setFacilityId(
                updatedRequest.getFacilityId()
        );

        existingRequest.setEquipmentId(
                updatedRequest.getEquipmentId()
        );

        existingRequest.setProblemDescription(
                updatedRequest.getProblemDescription()
        );

        existingRequest.setPriority(
                updatedRequest.getPriority()
        );

        existingRequest.setStatus(
                updatedRequest.getStatus()
        );

        return serviceRequestRepository.save(
                existingRequest
        );
    }

    // Update status
    public ServiceRequest updateServiceRequestStatus(
            Long id,
            ServiceRequestStatus status) {

        ServiceRequest serviceRequest =
                serviceRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service request not found"
                                )
                        );

        serviceRequest.setStatus(status);

        return serviceRequestRepository.save(
                serviceRequest
        );
    }

    // Delete service request
    public void deleteServiceRequest(Long id) {

        if (!serviceRequestRepository.existsById(id)) {

            throw new RuntimeException(
                    "Service request not found"
            );
        }

        serviceRequestRepository.deleteById(id);
    }
}