package com.keystone.backend.controller;

import com.keystone.backend.entity.Notification;
import com.keystone.backend.repository.NotificationRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    // Get all notifications for a user
    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(
            @PathVariable Long userId) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get unread notifications for a user
    @GetMapping("/user/{userId}/unread")
    public List<Notification> getUnreadNotifications(
            @PathVariable Long userId) {

        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    // Get unread notification count
    @GetMapping("/user/{userId}/unread-count")
    public long getUnreadCount(
            @PathVariable Long userId) {

        return notificationRepository
                .countByUserIdAndIsReadFalse(userId);
    }

    // Create notification
    @PostMapping
    public Notification createNotification(
            @RequestBody Notification notification) {

        if (notification.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (notification.getTitle() == null ||
                notification.getTitle().trim().isEmpty()) {

            throw new RuntimeException("Notification title is required");
        }

        if (notification.getType() == null ||
                notification.getType().trim().isEmpty()) {

            throw new RuntimeException("Notification type is required");
        }

        return notificationRepository.save(notification);
    }

    // Mark notification as read
    @PutMapping("/{id}/read")
    public Notification markAsRead(
            @PathVariable Long id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"));

        notification.setRead(true);

        return notificationRepository.save(notification);
    }

    // Mark all notifications of a user as read
    @PutMapping("/user/{userId}/read-all")
    public String markAllAsRead(
            @PathVariable Long userId) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(userId);

        for (Notification notification : notifications) {
            notification.setRead(true);
        }

        notificationRepository.saveAll(notifications);

        return "All notifications marked as read";
    }

    // Delete notification
    @DeleteMapping("/{id}")
    public String deleteNotification(
            @PathVariable Long id) {

        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException(
                    "Notification not found");
        }

        notificationRepository.deleteById(id);

        return "Notification deleted successfully";
    }
}