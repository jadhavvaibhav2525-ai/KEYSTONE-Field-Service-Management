package com.keystone.backend.service;

import com.keystone.backend.entity.PartsUsage;
import com.keystone.backend.repository.PartsUsageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PartsUsageService {

    private final PartsUsageRepository partsUsageRepository;

    public PartsUsageService(
            PartsUsageRepository partsUsageRepository) {
        this.partsUsageRepository = partsUsageRepository;
    }

    public List<PartsUsage> getAllPartsUsage() {
        return partsUsageRepository.findAll();
    }

    public Optional<PartsUsage> getPartsUsageById(Long id) {
        return partsUsageRepository.findById(id);
    }

    public List<PartsUsage> getPartsByWorkOrder(Long workOrderId) {
        return partsUsageRepository.findByWorkOrderId(workOrderId);
    }

    public List<PartsUsage> getPartsByServiceRequest(Long serviceRequestId) {
        return partsUsageRepository.findByServiceRequestId(serviceRequestId);
    }

    public List<PartsUsage> getPartsByTechnician(Long technicianId) {
        return partsUsageRepository.findByTechnicianId(technicianId);
    }

    public PartsUsage createPartsUsage(PartsUsage partsUsage) {
        return partsUsageRepository.save(partsUsage);
    }

    public Optional<PartsUsage> updatePartsUsage(
        Long id,
        PartsUsage updatedPartsUsage) {

    return partsUsageRepository.findById(id)
            .map(existingPartsUsage -> {

                if (updatedPartsUsage.getWorkOrderId() != null) {
                    existingPartsUsage.setWorkOrderId(
                            updatedPartsUsage.getWorkOrderId()
                    );
                }

                if (updatedPartsUsage.getServiceRequestId() != null) {
                    existingPartsUsage.setServiceRequestId(
                            updatedPartsUsage.getServiceRequestId()
                    );
                }

                if (updatedPartsUsage.getTechnicianId() != null) {
                    existingPartsUsage.setTechnicianId(
                            updatedPartsUsage.getTechnicianId()
                    );
                }

                if (updatedPartsUsage.getPartName() != null) {
                    existingPartsUsage.setPartName(
                            updatedPartsUsage.getPartName()
                    );
                }

                if (updatedPartsUsage.getPartNumber() != null) {
                    existingPartsUsage.setPartNumber(
                            updatedPartsUsage.getPartNumber()
                    );
                }

                if (updatedPartsUsage.getQuantity() != null) {
                    existingPartsUsage.setQuantity(
                            updatedPartsUsage.getQuantity()
                    );
                }

                if (updatedPartsUsage.getUnitCost() != null) {
                    existingPartsUsage.setUnitCost(
                            updatedPartsUsage.getUnitCost()
                    );
                }

                if (updatedPartsUsage.getUsedAt() != null) {
                    existingPartsUsage.setUsedAt(
                            updatedPartsUsage.getUsedAt()
                    );
                }

                return partsUsageRepository.save(
                        existingPartsUsage
                );
            });
}

    public boolean deletePartsUsage(Long id) {

        if (!partsUsageRepository.existsById(id)) {
            return false;
        }

        partsUsageRepository.deleteById(id);
        return true;
    }
}