package com.keystone.backend.service;

import com.keystone.backend.entity.PasswordResetToken;
import com.keystone.backend.entity.User;
import com.keystone.backend.repository.PasswordResetTokenRepository;
import com.keystone.backend.repository.UserRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();
    private final BCryptPasswordEncoder codeEncoder =
            new BCryptPasswordEncoder();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    // Request a 6-digit passcode by email
    @Transactional
    public void requestPasswordReset(String email) {

        String normalizedEmail = email.trim().toLowerCase();

        Optional<User> user =
                userRepository.findByEmail(normalizedEmail);

        // Do not reveal whether an account exists.
        if (user.isEmpty()) {
            return;
        }

        String resetCode = String.valueOf(
                100000 + secureRandom.nextInt(900000)
        );

        String codeHash = codeEncoder.encode(resetCode);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(10);

        // Remove previous reset codes for this email.
        tokenRepository.deleteByEmail(normalizedEmail);

        PasswordResetToken resetToken =
                new PasswordResetToken(
                        normalizedEmail,
                        codeHash,
                        expiry,
                        now
                );

        tokenRepository.save(resetToken);

        emailService.sendPasswordResetCode(
                normalizedEmail,
                resetCode
        );
    }

    // Verify the emailed passcode
    @Transactional(readOnly = true)
    public boolean verifyResetCode(String email, String code) {

        String normalizedEmail = email.trim().toLowerCase();

        PasswordResetToken resetToken = getValidToken(normalizedEmail);

        return codeEncoder.matches(
                code.trim(),
                resetToken.getCodeHash()
        );
    }

    // Verify the code again and update the password
    @Transactional
    public void resetPassword(
            String email,
            String code,
            String newPassword) {

        String normalizedEmail = email.trim().toLowerCase();

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must contain at least 8 characters."
            );
        }

        PasswordResetToken resetToken = getValidToken(normalizedEmail);

        boolean codeMatches = codeEncoder.matches(
                code.trim(),
                resetToken.getCodeHash()
        );

        if (!codeMatches) {
            throw new IllegalArgumentException(
                    "Invalid or expired passcode."
            );
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid or expired passcode."
                        )
                );

        // Use the same PasswordEncoder as the existing login system.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate the passcode after successful password reset.
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    private PasswordResetToken getValidToken(String email) {

        PasswordResetToken resetToken =
                tokenRepository
                        .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired passcode."
                                )
                        );

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Invalid or expired passcode."
            );
        }

        return resetToken;
    }
}