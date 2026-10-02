package com.keystone.backend.config;

import com.keystone.backend.security.JwtAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String frontendOrigin;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // =========================
    // PASSWORD ENCODER
    // =========================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================
    // SECURITY FILTER CHAIN
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // =========================
                // CORS
                // =========================
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))

                // =========================
                // CSRF
                // =========================
                .csrf(csrf -> csrf.disable())

                // =========================
                // STATELESS JWT
                // =========================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // =========================
                // AUTHORIZATION
                // =========================
                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // PUBLIC ENDPOINTS
                        // =========================

                        .requestMatchers(
                                "/",
                                "/health",
                                "/api/v1/health"
                        ).permitAll()

                        // Authentication endpoints
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/auth/**"
                        ).permitAll()

                        // Spring error endpoint
                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        // =========================
                        // USER MANAGEMENT
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/**"
                        ).hasRole("ADMIN")

                        // =========================
                        // FACILITIES
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/facilities/customer/me"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                "/api/facilities/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        // =========================
                        // EQUIPMENT
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/equipment/facility/*"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                "/api/equipment/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        // =========================
                        // CUSTOMERS
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/customers/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/customers/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/customers/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/customers/**"
                        ).hasRole("ADMIN")

                        // =========================
                        // SERVICE REQUESTS
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/service-requests/technician/**"
                        ).hasAnyRole(
                                "TECHNICIAN",
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/service-requests/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN",
                                "CUSTOMER"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/service-requests/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "CUSTOMER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/service-requests/*/assign"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/service-requests/*/status"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/service-requests/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/service-requests/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        // =========================
                        // WORK ORDERS
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/work-orders/customer/me"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/work-orders/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/work-orders/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/work-orders/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/work-orders/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        // =========================
                        // SERVICE REPORTS
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/service-reports/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/service-reports/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/service-reports/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/service-reports/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER"
                        )

                        // =========================
                        // PARTS USAGE
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/parts-usage/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/parts-usage/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/parts-usage/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/parts-usage/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        // =========================
                        // TIME TRACKING
                        // =========================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/time-tracking/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/time-tracking/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/time-tracking/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/time-tracking/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "DISPATCHER",
                                "MANAGER",
                                "TECHNICIAN"
                        )

                        // =========================
                        // NOTIFICATIONS
                        // =========================

                        .requestMatchers(
                                "/api/notifications/**"
                        ).authenticated()

                        // =========================
                        // EVERYTHING ELSE
                        // =========================

                        .anyRequest().authenticated()
                )

                // =========================
                // JWT FILTER
                // =========================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // =========================
    // CORS CONFIGURATION
    // =========================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(frontendOrigin)
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}