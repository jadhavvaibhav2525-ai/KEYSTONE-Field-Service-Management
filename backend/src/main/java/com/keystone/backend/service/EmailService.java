package com.keystone.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetCode(String recipientEmail, String resetCode) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(recipientEmail);
        message.setSubject("KEYSTONE Password Reset Passcode");

        message.setText(
                "Hello,\n\n" +
                "Your KEYSTONE password-reset passcode is: " + resetCode + "\n\n" +
                "This passcode expires in 10 minutes.\n\n" +
                "If you did not request a password reset, you can ignore this email.\n\n" +
                "Regards,\n" +
                "KEYSTONE Support"
        );

        mailSender.send(message);
    }
}