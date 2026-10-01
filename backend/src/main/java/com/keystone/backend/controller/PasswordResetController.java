package com.keystone.backend.controller;

import com.keystone.backend.dto.ForgotPasswordRequest;
import com.keystone.backend.dto.ResetPasswordRequest;
import com.keystone.backend.dto.VerifyResetCodeRequest;
import com.keystone.backend.service.PasswordResetService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required.");
        }

        passwordResetService.requestPasswordReset(
                request.getEmail()
        );

        return ResponseEntity.ok(
                "If an account exists for this email, a passcode has been sent."
        );
    }

    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(
            @RequestBody VerifyResetCodeRequest request) {

        if (request.getEmail() == null ||
                request.getEmail().isBlank() ||
                request.getCode() == null ||
                request.getCode().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email and passcode are required.");
        }

        try {
            boolean valid = passwordResetService.verifyResetCode(
                    request.getEmail(),
                    request.getCode()
            );

            if (!valid) {
                return ResponseEntity.badRequest()
                        .body("Invalid or expired passcode.");
            }

            return ResponseEntity.ok("Passcode verified.");
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(exception.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        if (request.getEmail() == null ||
                request.getEmail().isBlank() ||
                request.getCode() == null ||
                request.getCode().isBlank() ||
                request.getNewPassword() == null ||
                request.getNewPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email, passcode, and new password are required.");
        }

        try {
            passwordResetService.resetPassword(
                    request.getEmail(),
                    request.getCode(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(
                    "Password reset successfully. You can now log in."
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(exception.getMessage());
        }
    }
}