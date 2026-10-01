package com.keystone.backend;

import com.keystone.backend.entity.Role;
import com.keystone.backend.entity.User;
import com.keystone.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword) {

        return args -> {
            if (adminPassword.isBlank()) {
                System.out.println(
                        "Admin account was not initialized; set ADMIN_PASSWORD to enable bootstrap."
                );
                return;
            }

            User admin = userRepository
                    .findByEmail(adminEmail)
                    .orElse(null);

            if (admin == null) {
                admin = new User(
                        "System Administrator",
                        adminEmail,
                        passwordEncoder.encode(adminPassword)
                );
            } else {
                if (!passwordEncoder.matches(
                        adminPassword,
                        admin.getPassword()
                )) {
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                }
            }

            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
            }

            userRepository.save(admin);
        };
    }
}