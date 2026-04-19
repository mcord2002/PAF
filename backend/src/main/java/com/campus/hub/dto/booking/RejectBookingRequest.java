package com.campus.hub.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// DTO used when an admin rejects a booking
public record RejectBookingRequest(

		// Reason for rejecting the booking
		// - Must not be empty (@NotBlank)
		// - Maximum length is 1000 characters
		@NotBlank @Size(max = 1000) String reason

) {
}