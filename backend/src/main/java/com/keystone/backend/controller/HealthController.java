package com.keystone.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping({"/health", "/api/v1/health"})
    public String health() {
        return "KEYSTONE Backend is running successfully!";
    }

    @GetMapping("/")
    public String root() {
        return "KEYSTONE Backend is running successfully!";
    }
}