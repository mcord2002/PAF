package com.campus.hub.dto.resource;

import com.campus.hub.domain.ResourceStatus;
import com.campus.hub.domain.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// DTO used when creating or updating a resource (facility/asset)
public record ResourceRequest(

		// Name of the resource (required, max 200 characters)
		@NotBlank @Size(max = 200) String name,

		// Type of resource (LECTURE_HALL, LAB, etc.) - must not be null
		@NotNull ResourceType type,

		// Capacity of the resource (must be 0 or more)
		@NotNull @Min(0) Integer capacity,

		// Location of the resource (required, max 300 characters)
		@NotBlank @Size(max = 300) String location,

		// Optional availability schedule (e.g., "Mon-Fri 08:00-17:00")
		// Max length 2000 characters
		@Size(max = 2000) String availabilityWindows,

		// Status of the resource (ACTIVE or OUT_OF_SERVICE)
		// Optional - backend may assign default if null
		ResourceStatus status

) {
}