package com.keystone.backend.repository;

import com.keystone.backend.entity.PartsUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartsUsageRepository
        extends JpaRepository<PartsUsage, Long> {

    List<PartsUsage> findByWorkOrderId(Long workOrderId);

    List<PartsUsage> findByServiceRequestId(Long serviceRequestId);

    List<PartsUsage> findByTechnicianId(Long technicianId);
}