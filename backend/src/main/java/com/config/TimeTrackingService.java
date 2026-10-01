package com.keystone.backend.service;

import com.keystone.backend.entity.TimeTracking;
import com.keystone.backend.repository.TimeTrackingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TimeTrackingService {

    private final TimeTrackingRepository timeTrackingRepository;

    public TimeTrackingService(
            TimeTrackingRepository timeTrackingRepository) {

        this.timeTrackingRepository = timeTrackingRepository;
    }

    public List<TimeTracking> getAllTimeTracking() {
        return timeTrackingRepository.findAll();
    }

    public Optional<TimeTracking> getTimeTrackingById(Long id) {
        return timeTrackingRepository.findById(id);
    }

    public List<TimeTracking> getTimeByWorkOrder(Long workOrderId) {
        return timeTrackingRepository.findByWorkOrderId(workOrderId);
    }

    public List<TimeTracking> getTimeByServiceRequest(
            Long serviceRequestId) {

        return timeTrackingRepository
                .findByServiceRequestId(serviceRequestId);
    }

    public List<TimeTracking> getTimeByTechnician(
            Long technicianId) {

        return timeTrackingRepository
                .findByTechnicianId(technicianId);
    }

    public TimeTracking createTimeTracking(
            TimeTracking timeTracking) {

        return timeTrackingRepository.save(timeTracking);
    }

    public Optional<TimeTracking> updateTimeTracking(
            Long id,
            TimeTracking updatedTimeTracking) {

        return timeTrackingRepository.findById(id)
                .map(existingTimeTracking -> {

                    if (updatedTimeTracking.getWorkOrderId() != null) {
                        existingTimeTracking.setWorkOrderId(
                                updatedTimeTracking.getWorkOrderId()
                        );
                    }

                    if (updatedTimeTracking.getServiceRequestId() != null) {
                        existingTimeTracking.setServiceRequestId(
                                updatedTimeTracking.getServiceRequestId()
                        );
                    }

                    if (updatedTimeTracking.getTechnicianId() != null) {
                        existingTimeTracking.setTechnicianId(
                                updatedTimeTracking.getTechnicianId()
                        );
                    }

                    if (updatedTimeTracking.getStartTime() != null) {
                        existingTimeTracking.setStartTime(
                                updatedTimeTracking.getStartTime()
                        );
                    }

                    if (updatedTimeTracking.getEndTime() != null) {
                        existingTimeTracking.setEndTime(
                                updatedTimeTracking.getEndTime()
                        );
                    }

                    if (updatedTimeTracking.getBreakMinutes() != null) {
                        existingTimeTracking.setBreakMinutes(
                                updatedTimeTracking.getBreakMinutes()
                        );
                    }

                    if (updatedTimeTracking.getRemarks() != null) {
                        existingTimeTracking.setRemarks(
                                updatedTimeTracking.getRemarks()
                        );
                    }

                    return timeTrackingRepository.save(
                            existingTimeTracking
                    );
                });
    }

    public boolean deleteTimeTracking(Long id) {

        if (!timeTrackingRepository.existsById(id)) {
            return false;
        }

        timeTrackingRepository.deleteById(id);

        return true;
    }
}