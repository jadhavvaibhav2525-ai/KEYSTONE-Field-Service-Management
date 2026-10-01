package com.keystone.backend.repository;

import com.keystone.backend.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkOrderRepository
        extends JpaRepository<WorkOrder, Long> {

    // Get work orders assigned to technician
    List<WorkOrder> findByTechnicianId(Long technicianId);

    // Get work orders belonging to customer
    List<WorkOrder> findByCustomerId(Long customerId);

    // Find work order created from a service request
    Optional<WorkOrder> findByServiceRequestId(Long serviceRequestId);
}