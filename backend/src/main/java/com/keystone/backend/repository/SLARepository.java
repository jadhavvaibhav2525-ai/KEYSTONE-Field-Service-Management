package com.keystone.backend.repository;

import com.keystone.backend.entity.SLA;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SLARepository extends JpaRepository<SLA, Long> {

    Optional<SLA> findByServiceRequestId(Long serviceRequestId);

    boolean existsByServiceRequestId(Long serviceRequestId);
}