package com.keystone.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_reports")
public class ServiceReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================================
    // WORK ORDER
    // =========================================================

    // Work order associated with this service report
    private Long workOrderId;


    // =========================================================
    // SERVICE REQUEST
    // =========================================================

    // Service request associated with this service report
    private Long serviceRequestId;


    // =========================================================
    // TECHNICIAN
    // =========================================================

    // Technician who submitted the report
    @Column(nullable = false)
    private Long technicianId;


    // =========================================================
    // SERVICE DETAILS
    // =========================================================

    // Description of work performed
    @Column(columnDefinition = "TEXT")
    private String workPerformed;

    // Technician's remarks or notes
    @Column(columnDefinition = "TEXT")
    private String technicianRemarks;

    // Parts/materials used during service
    @Column(columnDefinition = "TEXT")
    private String partsUsed;

    // Problems or issues found during service
    @Column(columnDefinition = "TEXT")
    private String issuesFound;

    // Service duration in minutes
    private Integer serviceDurationMinutes;


    // =========================================================
    // TIMESTAMPS
    // =========================================================

    // When the service was completed
    private LocalDateTime completedAt;

    // Record creation timestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Record last update timestamp
    private LocalDateTime updatedAt;


    // =========================================================
    // DEFAULT CONSTRUCTOR
    // =========================================================

    public ServiceReport() {
    }


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ServiceReport(
            Long workOrderId,
            Long serviceRequestId,
            Long technicianId,
            String workPerformed,
            String technicianRemarks,
            String partsUsed,
            String issuesFound,
            Integer serviceDurationMinutes,
            LocalDateTime completedAt
    ) {

        this.workOrderId = workOrderId;
        this.serviceRequestId = serviceRequestId;
        this.technicianId = technicianId;
        this.workPerformed = workPerformed;
        this.technicianRemarks = technicianRemarks;
        this.partsUsed = partsUsed;
        this.issuesFound = issuesFound;
        this.serviceDurationMinutes = serviceDurationMinutes;
        this.completedAt = completedAt;
    }


    // =========================================================
    // AUTOMATIC TIMESTAMPS
    // =========================================================

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }


    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public Long getWorkOrderId() {
        return workOrderId;
    }

    public void setWorkOrderId(Long workOrderId) {
        this.workOrderId = workOrderId;
    }


    public Long getServiceRequestId() {
        return serviceRequestId;
    }

    public void setServiceRequestId(Long serviceRequestId) {
        this.serviceRequestId = serviceRequestId;
    }


    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }


    public String getWorkPerformed() {
        return workPerformed;
    }

    public void setWorkPerformed(String workPerformed) {
        this.workPerformed = workPerformed;
    }


    public String getTechnicianRemarks() {
        return technicianRemarks;
    }

    public void setTechnicianRemarks(
            String technicianRemarks) {

        this.technicianRemarks = technicianRemarks;
    }


    public String getPartsUsed() {
        return partsUsed;
    }

    public void setPartsUsed(String partsUsed) {
        this.partsUsed = partsUsed;
    }


    public String getIssuesFound() {
        return issuesFound;
    }

    public void setIssuesFound(String issuesFound) {
        this.issuesFound = issuesFound;
    }


    public Integer getServiceDurationMinutes() {
        return serviceDurationMinutes;
    }

    public void setServiceDurationMinutes(
            Integer serviceDurationMinutes) {

        this.serviceDurationMinutes =
                serviceDurationMinutes;
    }


    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(
            LocalDateTime completedAt) {

        this.completedAt = completedAt;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt = createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {

        this.updatedAt = updatedAt;
    }
}