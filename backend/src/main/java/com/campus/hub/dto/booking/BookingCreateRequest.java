//create booking requestmodel
package com.campus.hub.dto.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

// DTO used when creating a new booking request
public record BookingCreateRequest(

		// ID of the resource to be booked (must not be null)
		@NotNull Long resourceId,

		// Start date and time of the booking (must not be null)
		@NotNull Instant startAt,

		// End date and time of the booking (must not be null)
		@NotNull Instant endAt,

		// Purpose of the booking (required, max 500 characters)
		@NotBlank @Size(max = 500) String purpose,

		// Optional number of expected attendees (must be 0 or more if provided)
		@Min(0) Integer expectedAttendees
) {
}