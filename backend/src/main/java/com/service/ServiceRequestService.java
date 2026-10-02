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

    // =========================================================
    // GET ALL SERVICE REQUESTS
    // =========================================================

    public List<ServiceRequest> getAllServiceRequests() {

        return serviceRequestRepository.findAll();
    }

    // =========================================================
    // GET SERVICE REQUEST BY ID
    // =========================================================

    public ServiceRequest getServiceRequestById(Long id) {

        return serviceRequestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Service request not found"
                        )
                );
    }

    // =========================================================
    // GET SERVICE REQUESTS BY CUSTOMER
    // =========================================================

    public List<ServiceRequest> getServiceRequestsByCustomer(
            Long customerId) {

        return serviceRequestRepository
                .findByCustomerId(customerId);
    }

    // =========================================================
    // GET SERVICE REQUESTS BY TECHNICIAN
    // =========================================================

    public List<ServiceRequest> getServiceRequestsByTechnician(
            Long technicianId) {

        return serviceRequestRepository
                .findByTechnicianId(technicianId);
    }

    // =========================================================
    // GET SERVICE REQUESTS BY STATUS
    // =========================================================

    public List<ServiceRequest> getServiceRequestsByStatus(
            ServiceRequestStatus status) {

        return serviceRequestRepository
                .findByStatus(status);
    }

    // =========================================================
    // CREATE SERVICE REQUEST
    // =========================================================

    public ServiceRequest createServiceRequest(
            ServiceRequest serviceRequest) {

        /*
         * Set default priority if the customer
         * does not provide one.
         */
        if (serviceRequest.getPriority() == null) {

            serviceRequest.setPriority(
                    com.keystone.backend.entity
                            .ServiceRequestPriority.MEDIUM
            );
        }

        /*
         * If there is no facility assigned,
         * keep the request pending until Admin
         * assigns a facility.
         */
        if (serviceRequest.getFacilityId() == null) {

            serviceRequest.setStatus(
                    ServiceRequestStatus.PENDING_FACILITY
            );

        } else if (serviceRequest.getStatus() == null) {

            /*
             * If a facility already exists,
             * the request can enter the normal workflow.
             */
            serviceRequest.setStatus(
                    ServiceRequestStatus.NEW
            );
        }

        /*
         * Save the service request first.
         */
        ServiceRequest savedRequest =
                serviceRequestRepository.save(
                        serviceRequest
                );

        /*
         * Only create a Work Order when
         * a facility exists.
         *
         * This prevents a request without
         * a facility from entering the
         * dispatcher/technician workflow.
         */
        if (savedRequest.getFacilityId() != null) {

            workOrderService.createFromServiceRequest(
                    savedRequest
            );
        }

        return savedRequest;
    }

    // =========================================================
    // UPDATE SERVICE REQUEST
    // =========================================================

    public ServiceRequest updateServiceRequest(
            Long id,
            ServiceRequest updatedRequest) {

        /*
         * Find the existing service request.
         */
        ServiceRequest existingRequest =
                serviceRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service request not found"
                                )
                        );

        /*
         * Remember whether this request was
         * waiting for a facility.
         */
        boolean wasPendingFacility =
                existingRequest.getStatus()
                        == ServiceRequestStatus.PENDING_FACILITY;

        /*
         * Update customer information.
         */
        existingRequest.setCustomerId(
                updatedRequest.getCustomerId()
        );

        existingRequest.setCustomerName(
                updatedRequest.getCustomerName()
        );

        existingRequest.setCustomerEmail(
                updatedRequest.getCustomerEmail()
        );

        /*
         * Update facility and equipment.
         */
        existingRequest.setFacilityId(
                updatedRequest.getFacilityId()
        );

        existingRequest.setEquipmentId(
                updatedRequest.getEquipmentId()
        );

        /*
         * Update problem and priority.
         */
        existingRequest.setProblemDescription(
                updatedRequest.getProblemDescription()
        );

        existingRequest.setPriority(
                updatedRequest.getPriority()
        );

        /*
         * If this request was waiting for a facility
         * and Admin has now assigned a facility,
         * move it into the normal NEW state.
         */
        if (wasPendingFacility
                && updatedRequest.getFacilityId() != null) {

            existingRequest.setStatus(
                    ServiceRequestStatus.NEW
            );

        } else if (updatedRequest.getStatus() != null) {

            /*
             * For all other updates, preserve the
             * status supplied by the caller.
             */
            existingRequest.setStatus(
                    updatedRequest.getStatus()
            );
        }

        /*
         * Save the updated service request.
         */
        ServiceRequest savedRequest =
                serviceRequestRepository.save(
                        existingRequest
                );

        /*
         * If this request was previously waiting
         * for a facility and now has one,
         * automatically create its Work Order.
         *
         * WorkOrderService already prevents duplicate
         * Work Orders for the same Service Request.
         */
        if (wasPendingFacility
                && savedRequest.getFacilityId() != null) {

            workOrderService.createFromServiceRequest(
                    savedRequest
            );
        }

        return savedRequest;
    }

    // =========================================================
    // UPDATE SERVICE REQUEST STATUS
    // =========================================================

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

    // =========================================================
    // DELETE SERVICE REQUEST
    // =========================================================

    public void deleteServiceRequest(Long id) {

        if (!serviceRequestRepository.existsById(id)) {

            throw new RuntimeException(
                    "Service request not found"
            );
        }

        serviceRequestRepository.deleteById(id);
    }
}