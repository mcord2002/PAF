package com.campus.hub.repository;

import com.campus.hub.entity.HubNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HubNotificationRepository extends JpaRepository<HubNotification, Long> {

	List<HubNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

	long countByUserIdAndReadFlagFalse(Long userId);

	long deleteByIdAndUserId(Long id, Long userId);
}
//Add Notification entity/model and repository
//Initial backend structure for notifications.
//Implement Notification service logic
//Business logic for creating, fetching, and marking notifications.