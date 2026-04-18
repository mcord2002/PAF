package com.campus.hub.dto.booking;

import com.campus.hub.domain.BookingStatus;
import com.campus.hub.dto.resource.ResourceResponse;

import java.time.Instant;

public record BookingResponse(
		Long id,
		Long requesterId,
		String requesterName,
		ResourceResponse resource,
		Instant startAt,
		Instant endAt,
		String purpose,
		Integer expectedAttendees,
		BookingStatus status,
		String adminReason,
		Long reviewedById,
		Instant reviewedAt,
		Instant createdAt
) {
}
