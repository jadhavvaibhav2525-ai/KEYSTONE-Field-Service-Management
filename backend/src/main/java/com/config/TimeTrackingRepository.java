package com.keystone.backend.repository;

import com.keystone.backend.entity.TimeTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeTrackingRepository
        extends JpaRepository<TimeTracking, Long> {

    List<TimeTracking> findByWorkOrderId(Long workOrderId);

    List<TimeTracking> findByServiceRequestId(Long serviceRequestId);

    List<TimeTracking> findByTechnicianId(Long technicianId);
}