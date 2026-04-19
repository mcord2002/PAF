package com.campus.hub.dto.notification;

import com.campus.hub.domain.NotificationType;

import java.time.Instant;

public record NotificationResponse(
		Long id,
		NotificationType type,
		String title,
		String message,
		Long relatedEntityId,
		boolean read,
		Instant createdAt
) {
}
//Add Notification entity/model and repository
//Initial backend structure for notifications.
//Implement Notification service logic
//Business logic for creating, fetching, and marking notifications.