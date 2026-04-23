//create booking requestmodel
package com.campus.hub.dto.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record BookingCreateRequest(
		@NotNull Long resourceId,
		@NotNull Instant startAt,
		@NotNull Instant endAt,
		@NotBlank @Size(max = 500) String purpose,
		@Min(0) Integer expectedAttendees
) {
}
