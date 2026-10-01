package com.keystone.backend.repository;

import com.keystone.backend.entity.ServiceReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceReportRepository
        extends JpaRepository<ServiceReport, Long> {

    Optional<ServiceReport> findByWorkOrderId(Long workOrderId);

    Optional<ServiceReport> findByServiceRequestId(Long serviceRequestId);

    boolean existsByServiceRequestId(Long serviceRequestId);
}