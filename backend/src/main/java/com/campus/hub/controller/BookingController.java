package com.campus.hub.controller;

import com.campus.hub.domain.BookingStatus;
import com.campus.hub.dto.booking.BookingCreateRequest;
import com.campus.hub.dto.booking.BookingResponse;
import com.campus.hub.dto.booking.RejectBookingRequest;
import com.campus.hub.security.SecurityUtils;
import com.campus.hub.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// REST controller for handling booking-related API endpoints
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

	// Service layer for booking logic
	private final BookingService bookingService;

	// Utility to get currently logged-in user
	private final SecurityUtils securityUtils;

	// Constructor injection
	public BookingController(BookingService bookingService, SecurityUtils securityUtils) {
		this.bookingService = bookingService;
		this.securityUtils = securityUtils;
	}

	// Create a new booking (USER or ADMIN)
	@PostMapping
	@PreAuthorize("hasAnyRole('USER','ADMIN')")
	public BookingResponse create(@Valid @RequestBody BookingCreateRequest request) {
		return bookingService.create(securityUtils.currentUser(), request);
	}

	// Get bookings of the current user
	@GetMapping("/me")
	@PreAuthorize("hasAnyRole('USER','ADMIN')")
	public List<BookingResponse> mine() {
		return bookingService.mine(securityUtils.currentUser());
	}

	// Get all bookings (ADMIN only) with optional filters
	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public List<BookingResponse> listAll(
			@RequestParam(required = false) BookingStatus status,
			@RequestParam(required = false) Long resourceId) {
		return bookingService.listAll(securityUtils.currentUser(), status, resourceId);
	}

	// Approve a booking (ADMIN only)
	@PatchMapping("/{id}/approve")
	@PreAuthorize("hasRole('ADMIN')")
	public BookingResponse approve(@PathVariable Long id) {
		return bookingService.approve(securityUtils.currentUser(), id);
	}

	// Reject a booking with reason (ADMIN only)
	@PatchMapping("/{id}/reject")
	@PreAuthorize("hasRole('ADMIN')")
	public BookingResponse reject(@PathVariable Long id, @Valid @RequestBody RejectBookingRequest request) {
		return bookingService.reject(securityUtils.currentUser(), id, request);
	}

	// Cancel a booking (USER or ADMIN)
	@PatchMapping("/{id}/cancel")
	@PreAuthorize("hasAnyRole('USER','ADMIN')")
	public BookingResponse cancel(@PathVariable Long id) {
		return bookingService.cancel(securityUtils.currentUser(), id);
	}
}