package com.keystone.backend.service;

import com.keystone.backend.entity.Notification;
import com.keystone.backend.entity.User;
import com.keystone.backend.repository.NotificationRepository;
import com.keystone.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(
            Long userId,
            String title,
            String message,
            String type,
            Long workOrderId) {

        Notification notification = new Notification(
                userId,
                title,
                message,
                type,
                workOrderId
        );

        return notificationRepository.save(notification);
    }

    public void notifyUsersByRole(
            String role,
            String title,
            String message,
            String type,
            Long workOrderId) {

        List<User> users = userRepository.findByRole(role);

        for (User user : users) {

            createNotification(
                    user.getId(),
                    title,
                    message,
                    type,
                    workOrderId
            );
        }
    }

    public List<Notification> getUserNotifications(Long userId) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {

        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {

        return notificationRepository
                .countByUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(Long notificationId) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                ));

        notification.setRead(true);

        return notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(userId);

        for (Notification notification : notifications) {
            notification.setRead(true);
        }

        notificationRepository.saveAll(notifications);
    }
}