package com.keystone.backend.repository;

import com.keystone.backend.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByCustomerId(Long customerId);
}