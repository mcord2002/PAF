package com.campus.hub.dto.booking;

import com.campus.hub.domain.BookingStatus;
import com.campus.hub.dto.resource.ResourceResponse;

import java.time.Instant;

// DTO used to return booking details to the frontend
public record BookingResponse(

		// Unique ID of the booking
		Long id,

		// ID of the user who requested the booking
		Long requesterId,

		// Name of the user who requested the booking
		String requesterName,

		// Resource details (room/equipment) being booked
		ResourceResponse resource,

		// Start date and time of the booking
		Instant startAt,

		// End date and time of the booking
		Instant endAt,

		// Purpose of the booking
		String purpose,

		// Number of expected attendees (optional)
		Integer expectedAttendees,

		// Current status of the booking (PENDING, APPROVED, etc.)
		BookingStatus status,

		// Reason provided by admin if booking is rejected
		String adminReason,

		// ID of the admin who reviewed (approved/rejected) the booking
		Long reviewedById,

		// Date and time when booking was reviewed
		Instant reviewedAt,

		// Date and time when booking was created
		Instant createdAt
) {
}