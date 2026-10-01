package com.keystone.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println(
                "========== JWT FILTER START =========="
        );

        System.out.println(
                "REQUEST METHOD: " + request.getMethod()
        );

        System.out.println(
                "REQUEST URI: " + request.getRequestURI()
        );

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            System.out.println(
                    "NO VALID JWT HEADER FOUND"
            );

            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authorizationHeader.substring(7);

        try {

            String email = jwtService.extractEmail(jwt);

            System.out.println(
                    "JWT EMAIL: " + email
            );

            boolean tokenValid =
                    jwtService.isTokenValid(jwt, email);

            System.out.println(
                    "JWT VALID: " + tokenValid
            );

            if (tokenValid) {

                String role =
                        jwtService.extractRole(jwt);

                System.out.println(
                        "JWT ROLE: " + role
                );

                if (role != null && !role.trim().isEmpty()) {

                    role = role.trim().toUpperCase();

                    String authority;

                    if (role.startsWith("ROLE_")) {
                        authority = role;
                    } else {
                        authority = "ROLE_" + role;
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    Collections.singletonList(
                                            new SimpleGrantedAuthority(
                                                    authority
                                            )
                                    )
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);

                    System.out.println(
                            "AUTHENTICATION SET SUCCESSFULLY"
                    );

                    System.out.println(
                            "AUTHENTICATION: "
                                    + SecurityContextHolder
                                    .getContext()
                                    .getAuthentication()
                    );

                    System.out.println(
                            "AUTHORITIES: "
                                    + SecurityContextHolder
                                    .getContext()
                                    .getAuthentication()
                                    .getAuthorities()
                    );

                } else {

                    System.out.println(
                            "JWT ROLE IS NULL OR EMPTY"
                    );
                }

            } else {

                System.out.println(
                        "JWT TOKEN IS INVALID OR EXPIRED"
                );
            }

        } catch (Exception e) {

            System.out.println(
                    "JWT ERROR: "
                            + e.getClass().getName()
                            + " - "
                            + e.getMessage()
            );
        }

        System.out.println(
                "AUTH BEFORE FILTER CHAIN: "
                        + SecurityContextHolder
                        .getContext()
                        .getAuthentication()
        );

        filterChain.doFilter(request, response);

        System.out.println(
                "========== JWT FILTER END =========="
        );
    }
}