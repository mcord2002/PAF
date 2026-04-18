
package com.campus.hub.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectBookingRequest(
		@NotBlank @Size(max = 1000) String reason
) {
}
