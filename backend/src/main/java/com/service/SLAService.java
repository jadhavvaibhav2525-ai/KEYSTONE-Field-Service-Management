package com.keystone.backend.service;

import com.keystone.backend.entity.SLA;
import com.keystone.backend.repository.SLARepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SLAService {

    private final SLARepository slaRepository;

    public SLAService(SLARepository slaRepository) {
        this.slaRepository = slaRepository;
    }

    // Get all SLA records
    public List<SLA> getAllSLAs() {
        return slaRepository.findAll();
    }

    // Get SLA by ID
    public Optional<SLA> getSLAById(Long id) {
        return slaRepository.findById(id);
    }

    // Get SLA by Service Request ID
    public Optional<SLA> getSLAByServiceRequestId(Long serviceRequestId) {
        return slaRepository.findByServiceRequestId(serviceRequestId);
    }

    // Create a new SLA
    public SLA createSLA(SLA sla) {

        if (sla.getServiceRequestId() == null) {
            throw new IllegalArgumentException(
                    "Service Request ID is required"
            );
        }

        if (slaRepository.existsByServiceRequestId(sla.getServiceRequestId())) {
            throw new IllegalArgumentException(
                    "An SLA already exists for this Service Request"
            );
        }

        validateTargets(
                sla.getResponseTargetMinutes(),
                sla.getResolutionTargetMinutes()
        );

        if (sla.getPriority() == null || sla.getPriority().isBlank()) {
            throw new IllegalArgumentException("Priority is required");
        }

        LocalDateTime now = LocalDateTime.now();

        sla.setResponseDueAt(
                now.plusMinutes(sla.getResponseTargetMinutes())
        );

        sla.setResolutionDueAt(
                now.plusMinutes(sla.getResolutionTargetMinutes())
        );

        sla.setRespondedAt(null);
        sla.setResolvedAt(null);
        sla.setResponseMet(null);
        sla.setResolutionMet(null);

        return slaRepository.save(sla);
    }

    // Update an existing SLA
    public Optional<SLA> updateSLA(Long id, SLA updatedSLA) {

        return slaRepository.findById(id).map(existingSLA -> {

            if (updatedSLA.getPriority() != null
                    && !updatedSLA.getPriority().isBlank()) {

                existingSLA.setPriority(updatedSLA.getPriority());
            }

            boolean targetChanged = false;

            if (updatedSLA.getResponseTargetMinutes() != null) {

                existingSLA.setResponseTargetMinutes(
                        updatedSLA.getResponseTargetMinutes()
                );

                targetChanged = true;
            }

            if (updatedSLA.getResolutionTargetMinutes() != null) {

                existingSLA.setResolutionTargetMinutes(
                        updatedSLA.getResolutionTargetMinutes()
                );

                targetChanged = true;
            }

            validateTargets(
                    existingSLA.getResponseTargetMinutes(),
                    existingSLA.getResolutionTargetMinutes()
            );

            // Recalculate deadlines if target times have changed
            if (targetChanged) {

                LocalDateTime baseTime =
                        existingSLA.getCreatedAt() != null
                                ? existingSLA.getCreatedAt()
                                : LocalDateTime.now();

                existingSLA.setResponseDueAt(
                        baseTime.plusMinutes(
                                existingSLA.getResponseTargetMinutes()
                        )
                );

                existingSLA.setResolutionDueAt(
                        baseTime.plusMinutes(
                                existingSLA.getResolutionTargetMinutes()
                        )
                );
            }

            if (updatedSLA.getRespondedAt() != null) {
                existingSLA.setRespondedAt(updatedSLA.getRespondedAt());
            }

            if (updatedSLA.getResolvedAt() != null) {
                existingSLA.setResolvedAt(updatedSLA.getResolvedAt());
            }

            // Calculate response SLA status
            if (existingSLA.getRespondedAt() != null) {

                existingSLA.setResponseMet(
                        !existingSLA.getRespondedAt()
                                .isAfter(existingSLA.getResponseDueAt())
                );
            }

            // Calculate resolution SLA status
            if (existingSLA.getResolvedAt() != null) {

                existingSLA.setResolutionMet(
                        !existingSLA.getResolvedAt()
                                .isAfter(existingSLA.getResolutionDueAt())
                );
            }

            return slaRepository.save(existingSLA);
        });
    }

    // Record when a technician responds to the service request
    public Optional<SLA> recordResponse(Long id) {

        return slaRepository.findById(id).map(sla -> {

            // Preserve the first recorded response
            if (sla.getRespondedAt() == null) {

                LocalDateTime responseTime = LocalDateTime.now();

                sla.setRespondedAt(responseTime);

                sla.setResponseMet(
                        !responseTime.isAfter(sla.getResponseDueAt())
                );
            }

            return slaRepository.save(sla);
        });
    }

    // Record when the service request is resolved
    public Optional<SLA> recordResolution(Long id) {

        return slaRepository.findById(id).map(sla -> {

            // Preserve the first recorded resolution
            if (sla.getResolvedAt() == null) {

                LocalDateTime resolutionTime = LocalDateTime.now();

                sla.setResolvedAt(resolutionTime);

                sla.setResolutionMet(
                        !resolutionTime.isAfter(sla.getResolutionDueAt())
                );
            }

            return slaRepository.save(sla);
        });
    }

    // Delete SLA
    public boolean deleteSLA(Long id) {

        if (!slaRepository.existsById(id)) {
            return false;
        }

        slaRepository.deleteById(id);
        return true;
    }

    // Validate SLA target times
    private void validateTargets(
            Integer responseTargetMinutes,
            Integer resolutionTargetMinutes
    ) {

        if (responseTargetMinutes == null || responseTargetMinutes <= 0) {
            throw new IllegalArgumentException(
                    "Response target must be greater than zero"
            );
        }

        if (resolutionTargetMinutes == null || resolutionTargetMinutes <= 0) {
            throw new IllegalArgumentException(
                    "Resolution target must be greater than zero"
            );
        }
    }
}