package com.campus.hub.controller;

import com.campus.hub.dto.notification.NotificationResponse;
import com.campus.hub.security.SecurityUtils;
import com.campus.hub.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

	private final NotificationService notificationService;
	private final SecurityUtils securityUtils;

	public NotificationController(NotificationService notificationService, SecurityUtils securityUtils) {
		this.notificationService = notificationService;
		this.securityUtils = securityUtils;
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public List<NotificationResponse> list() {
		return notificationService.list(securityUtils.currentUser());
	}

	@GetMapping("/unread-count")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public Map<String, Long> unreadCount() {
		return Map.of("count", notificationService.unreadCount(securityUtils.currentUser()));
	}

	@PatchMapping("/{id}/read")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public void markRead(@PathVariable Long id) {
		notificationService.markRead(securityUtils.currentUser(), id);
	}

	@PostMapping("/read-all")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public void markAllRead() {
		notificationService.markAllRead(securityUtils.currentUser());
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
	public void clearOne(@PathVariable Long id) {
		notificationService.clearOne(securityUtils.currentUser(), id);
	}
}
