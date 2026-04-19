package com.campus.hub.service;

import com.campus.hub.domain.NotificationType;
import com.campus.hub.dto.notification.NotificationResponse;
import com.campus.hub.entity.HubNotification;
import com.campus.hub.entity.User;
import com.campus.hub.exception.ApiException;
import com.campus.hub.repository.HubNotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class NotificationService {

	private final HubNotificationRepository notificationRepository;

	public NotificationService(HubNotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
	}

	@Transactional
	public void notifyUser(User user, NotificationType type, String title, String message, Long relatedEntityId) {
		HubNotification n = new HubNotification();
		n.setUser(user);
		n.setType(type);
		n.setTitle(title);
		n.setMessage(message);
		n.setRelatedEntityId(relatedEntityId);
		n.setReadFlag(false);
		notificationRepository.save(n);
	}

	@Transactional(readOnly = true)
	public List<NotificationResponse> list(User user) {
		return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
				.map(DtoMapper::toNotification)
				.toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount(User user) {
		return notificationRepository.countByUserIdAndReadFlagFalse(user.getId());
	}

	@Transactional
	public void markRead(User user, Long notificationId) {
		HubNotification n = notificationRepository.findById(notificationId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Notification not found"));
		if (!Objects.equals(n.getUser().getId(), user.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot modify this notification.");
		}
		n.setReadFlag(true);
		notificationRepository.save(n);
	}

	@Transactional
	public void markAllRead(User user) {
		List<HubNotification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
		for (HubNotification n : all) {
			if (!n.isReadFlag()) {
				n.setReadFlag(true);
			}
		}
		notificationRepository.saveAll(all);
	}

	@Transactional
	public void clearOne(User user, Long notificationId) {
		long removed = notificationRepository.deleteByIdAndUserId(notificationId, user.getId());
		if (removed == 0) {
			throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Notification not found");
		}
	}
}
//done

//Add Notification entity/model and repository
//Initial backend structure for notifications.
//Implement Notification service logic
//Business logic for creating, fetching, and marking notifications.