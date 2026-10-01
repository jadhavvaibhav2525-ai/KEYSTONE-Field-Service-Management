package com.keystone.backend.repository;

import com.keystone.backend.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    List<Equipment> findByFacilityId(Long facilityId);
}